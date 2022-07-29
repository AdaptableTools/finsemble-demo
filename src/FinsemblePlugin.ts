import { AdaptablePlugin } from '@adaptabletools/adaptable/types';
import { IAdaptable } from '@adaptabletools/adaptable/src/AdaptableInterfaces/IAdaptable';
import { Context, DesktopAgent } from '@finsemble/finsemble-core/types/typedefs/FDC3';
import {
  AdaptableApi,
  AdaptableFDC3EventInfo,
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

  onAdaptableReady(adaptable: IAdaptable) {
    this.adaptable = adaptable;
    this.init();
  }

  private async init() {
    await this.waitForFinsambleAndFDC3();

    this.subscribeToFDC3AdaptableMessages();
    this.listenToContextChange();
    this.listenToIntents();

    if (this.options.enableAdaptableAlerts) {
      this.integrateAdaptableAlerts();
    }
  }

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
    debugger;
    if (onContext) {
      fdc3.addContextListener(null, (context: Context) => {
        onContext(context, adaptable!.api);
      });
    }
  }

  private integrateAdaptableAlerts() {
    const finsamble = this.finsemble!;

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
              console.log('Alert button clicked', button);
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
}

export default (options?: FinsemblePluginOptions) => new FinsemblePlugin(options);
