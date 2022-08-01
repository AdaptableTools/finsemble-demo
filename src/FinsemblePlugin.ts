import { AdaptablePlugin } from '@adaptabletools/adaptable/types';
import { IAdaptable } from '@adaptabletools/adaptable/src/AdaptableInterfaces/IAdaptable';
import { Context, DesktopAgent } from '@finsemble/finsemble-core/types/typedefs/FDC3';
import {
  AdaptableApi,
  AdaptableFDC3EventInfo,
  AdaptableOptions,
  AlertButton,
  AlertFiredInfo,
  AlertFormContext,
  CustomFDC3Intent,
  FDC3Intent,
} from '@adaptabletools/adaptable-react-aggrid';
import { FSBLDesktop } from '@finsemble/finsemble-core/types/clients/Startup/FSBLDesktop';
import { ListenerCallback } from '@finsemble/finsemble-core/types/clients/routerClient';
import { IAction } from '@finsemble/finsemble-core/types/services/notification/types';

const defaultOptions: FinsemblePluginOptions = {
  availableIntents: [],
  enableAdaptableAlerts: true,
  applicationName: 'Adaptable',
};

interface FinsemblePluginOptions {
  applicationName?: string;
  /**
   * Intents to which to subscribe.
   */
  availableIntents?: (FDC3Intent | CustomFDC3Intent)[];
  /**
   * Called when an intent from `availableIntents` is raised.
   */
  onIntent?: (
    intent: FDC3Intent | CustomFDC3Intent,
    context: Context,
    adaptableApi: AdaptableApi
  ) => void;

  /**
   * Called when a context changes.
   */
  onContext?: (context: Context, adaptableApi: AdaptableApi) => void;

  stateOptions?: {
    persistInFinsamble: boolean;

    /**
     * Key used to save/load state in Finsemble.
     */
    key: string;

    /**
     * Topic used to save/load state in Finsemble.
     */
    topic: string;
  };

  /**
   * @default true
   */
  enableAdaptableAlerts?: boolean;
}

class FinsemblePlugin extends AdaptablePlugin {
  public options: FinsemblePluginOptions;
  public pluginId: string = 'finsemble';
  private adaptable?: IAdaptable;
  private fdc3?: DesktopAgent;
  private finsemble?: FSBLDesktop;

  constructor(options?: FinsemblePluginOptions) {
    super(options);
    this.options = { ...defaultOptions, ...options };
  }

  onAdaptableReady(adaptable: IAdaptable) {
    this.adaptable = adaptable;
    this.init();
  }

  beforeInit(adaptableOptions: AdaptableOptions) {
    if (this.options.stateOptions && this.options.stateOptions?.persistInFinsamble) {
      this.setupStateOptions(adaptableOptions);
    }
  }

  private async init() {
    await this.waitForFinsambleAndFDC3();

    this.subscribeToFDC3AdaptableMessages();
    this.listenToContextChange();
    this.listenToIntents();

    this.integrateAdaptableAlerts();
  }

  private setupStateOptions(adaptableOptions: AdaptableOptions) {
    adaptableOptions.stateOptions = {
      loadState: async () => {
        if (!this.options.stateOptions) {
          console.error('StateOptions are not set');
          return;
        }

        const StorageClient = FSBL.Clients.StorageClient;
        const data = await StorageClient.getStandardized({
          key: this.options.stateOptions.key,
          topic: this.options.stateOptions.topic,
        });
        if (data.err) {
          return Promise.reject(data.err);
        } else {
          return JSON.parse(data.data);
        }
      },
      saveState: async (state) => {
        const stateStr = JSON.stringify(state);
        const StorageClient = FSBL.Clients.StorageClient;
        return StorageClient.save({
          key: this.options.stateOptions!.key,
          topic: this.options.stateOptions!.topic,
          value: stateStr,
        });
      },
    };
  }

  async waitForFinsambleAndFDC3() {
    const finsamblePromise = window.FSBL
      ? window.FSBL
      : new Promise((resolve) => {
          window.addEventListener('FSBLReady', () => {
            resolve(window.FSBL);
          });
        });
    const fdc3Promise = window.fdc3
      ? window.fdc3
      : new Promise((resolve) => {
          window.addEventListener('fdc3Ready', () => {
            resolve(window.fdc3);
          });
        });

    await Promise.all([finsamblePromise, fdc3Promise]);

    const fdc3 = await window.fdc3;
    const finsemble = await window.FSBL;

    this.fdc3 = fdc3;
    this.finsemble = finsemble;
  }

  private integrateAdaptableAlerts() {
    if (!this.options.enableAdaptableAlerts) {
      return;
    }

    const finsamble = this.finsemble!;
    const adaptable = this.adaptable!;

    this.adaptable?.api.eventApi.on('AlertFired', (alertInfo: AlertFiredInfo) => {
      const alert = alertInfo.alert;
      const { alertType, header, message } = alert;
      const adaptableActions: IAction[] = [];

      if (
        alert.alertDefinition.AlertForm &&
        typeof alert.alertDefinition.AlertForm !== 'string' &&
        Array.isArray(alert.alertDefinition.AlertForm?.Buttons)
      ) {
        alert.alertDefinition.AlertForm.Buttons.forEach(
          async (button: AlertButton<AlertFormContext>) => {
            const adaptableActionId = `adaptable.action.${button.Label}.${Date.now()}`;
            const action: IAction = {
              buttonText: button.Label,
              type: finsamble.Clients.NotificationClient.ActionTypes.TRANSMIT,
              channel: adaptableActionId,
            };

            this.subscribeToAction(adaptableActionId, () => {
              const context: AlertFormContext = {
                alert: alert,
                adaptableApi: adaptable.api,
                formData: {},
              };
              adaptable.api.alertApi.executeAlertButton(button, context);
            });
            adaptableActions.push(action);
          }
        );
      }

      finsamble.Clients.NotificationClient.notify({
        title: header,
        details: message,
        source: this.options.applicationName,
        actions: adaptableActions,
      });

      // Returning false prevents adaptable from showing the alert notification.
      return false;
    });
  }

  private subscribeToAction(action: string, callback: () => void) {
    const finsamble = this.finsemble!;
    const { RouterClient, NotificationClient } = finsamble.Clients;

    let unsubscribe = () => {};
    const handler: ListenerCallback = (error, response) => {
      callback();
      unsubscribe();
    };

    unsubscribe = RouterClient.addListener(action, handler);
  }

  // FDC3 specific
  private subscribeToFDC3AdaptableMessages() {
    const fdc3 = this.fdc3!;
    this.adaptable?.api.eventApi.on('FDC3MessageSent', (eventInfo: AdaptableFDC3EventInfo) => {
      if (eventInfo.eventType === 'RaiseIntent' && eventInfo.intent && eventInfo.context) {
        fdc3.raiseIntent(eventInfo.intent, eventInfo.context as Context);
      }
      if (eventInfo.eventType === 'BroadcastMessage') {
        fdc3.broadcast(eventInfo.context as Context);
      }
    });
  }

  private async listenToIntents() {
    const fdc3 = this.fdc3!;
    this.options.availableIntents?.forEach((intent: FDC3Intent | CustomFDC3Intent) => {
      fdc3.addIntentListener(intent, (context: Context) => {
        this.options.onIntent?.(intent, context, this.adaptable!.api);
      });
    });
  }

  private listenToContextChange() {
    const fdc3 = this.fdc3!;
    const onContext = this.options.onContext;
    const adaptable = this.adaptable;

    if (onContext) {
      fdc3.addContextListener(null, (context: Context) => {
        onContext(context, adaptable!.api);
      });
    }
  }
}

export default (options?: FinsemblePluginOptions) => new FinsemblePlugin(options);
