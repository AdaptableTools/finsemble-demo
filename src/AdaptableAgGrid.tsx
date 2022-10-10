import * as React from 'react';
// import Adaptable Component and other types
import AdaptableReact, {
    AdaptableOptions,
    AdaptableApi,
    AdaptableModule,
    AdaptableMenuItem,
    AdaptableFDC3EventInfo,
    FinsemblePluginOptions,
    FinancePluginOptions,
} from '@adaptabletools/adaptable-react-aggrid';

// import agGrid Component
import { AgGridReact } from '@ag-grid-community/react';

import {RECOMMENDED_MODULES} from "./agGridModules";

import finance from '@adaptabletools/adaptable-plugin-finance';
import finsemble from '@adaptabletools/adaptable-plugin-finsemble';

import {TradeDataGenerator} from "./TradeDataGenerator";

const hiddenContextMenus: AdaptableModule[] = [
    'CellSummary',
    'ConditionalStyle',
    'CustomSort',
    'BulkUpdate',
    'Dashboard',
   // 'Export',
    'Filter',
    'FlashingCell',
    'FormatColumn',
    'GridInfo',
    'Layout',
    'PlusMinus',
];

// let ag-grid know which columns and what data to use and add some other properties
const gridOptions = TradeDataGenerator.getGridOptions();

const finsembleOptions: FinsemblePluginOptions = {
    stateOptions: {
        persistInFinsemble: false,
        key: 'local-finsemble-state-key',
        topic: 'local-finsemble-state-topic',
    },
    showAdaptableAlertsAsNotifications: true,
};

const financeOptions:FinancePluginOptions = {
    fdc3Columns: {
        contactColumns: [
            {
                columnId: 'lastUpdatedBy',
                nameColumnId: 'Last Updated By',
                intents: ['StartChat', 'ViewContact'],
                showBroadcastContextMenu: true,
            },
        ],

        instrumentColumns: [
            {
                columnId: 'ticker',
                nameColumnId: 'Ticker AFL',
                intents: ['ViewChart'],
                showBroadcastContextMenu: true,
            },
        ],
    },
    availableFDC3Intents: ['ViewChart'],
    onFDC3Intent: (intent: any, context, adaptableApi) => {
        const { type } = context;
        adaptableApi.systemStatusApi.setInfoSystemStatus(
            `FDC3 Intent (${intent}, ${type})`,
            JSON.stringify(context)
        );
    },
    onFDC3Context: (context, adaptableApi) => {
        const { type } = context;
        adaptableApi.systemStatusApi.setInfoSystemStatus(
            'FDC3 Context (' + type + ')',
            JSON.stringify(context)
        );
    },
}

// build the AdaptableOptions object
// in this example we are NOT passing in predefined config but in the real world you will ship the AdapTable with objects and permissions
const adaptableOptions: AdaptableOptions = {
    primaryKey: 'tradeId',
    licenseKey: process.env.REACT_APP_ADAPTABLE_LICENSE_KEY,
    userName: 'TestUserFinsemble',
    adaptableId: 'finsemble-adaptable-demo',
    plugins: [
        finance(financeOptions),
        finsemble(finsembleOptions)
    ],
    menuOptions: {
        // remove some menu items to keep things easier
        showAdaptableColumnMenu: (menuItem: AdaptableMenuItem) => {
            return !hiddenContextMenus.includes(menuItem.module as AdaptableModule);
        },
        showAdaptableContextMenu: (menuItem: AdaptableMenuItem) => {
            return !hiddenContextMenus.includes(menuItem.module as AdaptableModule);
        },
    },
    predefinedConfig: {
        Theme:{
            CurrentTheme:"dark"
        },
        Dashboard: {
            Tabs: [
                {
                    Name: 'Demo',
                    Toolbars: ['SystemStatus', 'Layout'],
                },
            ],
        },
        FormatColumn: {
            FormatColumns: [
                {
                    Scope: {
                        DataTypes: ['Date'],
                    },
                    DisplayFormat: {
                        Formatter: 'DateFormatter',
                        Options: {
                            Pattern: 'yyyy-MM-dd',
                        },
                    },
                },
            ],
        },
    },
};

const modules = RECOMMENDED_MODULES;

export const AdaptableAgGrid = ()=>{
    const adaptableApiRef = React.useRef<AdaptableApi>();
    return (
        <div style={{ display: 'flex', flexFlow: 'column', height: '100vh' }}>
            <AdaptableReact
                style={{ flex: 'none' }}
                gridOptions={gridOptions}
                adaptableOptions={adaptableOptions}
                onAdaptableReady={({ adaptableApi }) => {
                    // save a reference to adaptable api
                    adaptableApiRef.current = adaptableApi;

                    const tradeDataGenerator = TradeDataGenerator.initialize(adaptableApi);

                    const finsembleApi = adaptableApi.pluginsApi.getFinsemblePluginApi();

                    const fdc3Api = getFDC3();
                    fdc3Api?.addIntentListener("ViewChart", (context:any) => {
                        const { type } = context;

                        console.log(context)

                        adaptableApi.systemStatusApi.setInfoSystemStatus(
                                    'FDC3 Intent (' + type + ')',
                                    JSON.stringify(context)
                                );
                    })

                    adaptableApi.eventApi.on(
                        'FDC3MessageSent',
                        (eventInfo: AdaptableFDC3EventInfo) => {
                            if (eventInfo.eventType === 'RaiseIntent') {
                                const fdc3Api = getFDC3();
                                if(fdc3Api){
                                    console.log('Raising intent: ',eventInfo.intent, eventInfo.context)
                                    fdc3Api.raiseIntent(eventInfo.intent, eventInfo.context);
                                }else{
                                    console.error('AdapTable: No fdc3 object available!')
                                }
                            }
                        }
                    );
                }}
            />
            <div className="ag-theme-alpine" style={{ flex: 1 , height: 'calc(100vh - 40px)'}}>
                <AgGridReact gridOptions={gridOptions} modules={modules} />
            </div>
        </div>
    );
}


const getFDC3 = ()=>{
    return (globalThis as any).fdc3;
}