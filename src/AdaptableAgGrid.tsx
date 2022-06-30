import * as React from 'react';
// import Adaptable Component and other types
import AdaptableReact, {
    AdaptableOptions,
    AdaptableApi, AdaptableModule, AdaptableMenuItem, AdaptableFDC3EventInfo,
} from '@adaptabletools/adaptable-react-aggrid';

// import agGrid Component
import { AgGridReact } from '@ag-grid-community/react';

// import adaptable css and themes
import '@adaptabletools/adaptable-react-aggrid/base.css';
import '@adaptabletools/adaptable-react-aggrid/themes/light.css';
import '@adaptabletools/adaptable-react-aggrid/themes/dark.css';

// import aggrid themes (using new Balham theme)
import '@ag-grid-community/all-modules/dist/styles/ag-grid.css';
import '@ag-grid-community/all-modules/dist/styles/ag-theme-alpine.css';
import '@ag-grid-community/all-modules/dist/styles/ag-theme-alpine-dark.css';

import {
    AllEnterpriseModules,
    GridOptions,
} from '@ag-grid-enterprise/all-modules';

import {columnDefs} from "./columnDefs";
import {rowData} from "./rowData";
import finance from '@adaptabletools/adaptable-plugin-finance';

const hiddenContextMenus: AdaptableModule[] = [
    'CellSummary',
    'ConditionalStyle',
    'CustomSort',
    'BulkUpdate',
    'Dashboard',
    'Export',
    'Filter',
    'FlashingCell',
    'FormatColumn',
    'GridInfo',
    'Layout',
    'PlusMinus',
];

// let ag-grid know which columns and what data to use and add some other properties
const gridOptions: GridOptions = {
    defaultColDef: {
        resizable: true,
        enableRowGroup: true,
        sortable: true,
        editable: true,
        filter: true,
        floatingFilter: true,
    },
    columnDefs: columnDefs,
    rowData: rowData,
    sideBar: true,
    suppressMenuHide: true,
    enableRangeSelection: true,
    statusBar: {
        statusPanels: [
            {statusPanel: 'agTotalRowCountComponent', align: 'left'},
            {statusPanel: 'agFilteredRowCountComponent'},
            {
                key: 'Center Panel',
                statusPanel: 'AdaptableStatusPanel',
                align: 'center',
            },
        ],
    },
};

// build the AdaptableOptions object
// in this example we are NOT passing in predefined config but in the real world you will ship the AdapTable with objects and permissions
const adaptableOptions: AdaptableOptions = {
    primaryKey: 'EmployeeId',
    licenseKey: process.env.REACT_APP_ADAPTABLE_LICENSE_KEY,
    userName: 'testUserFinsemble',
    adaptableId: 'FinsembleDemo',
    plugins: [
        finance({
            fdc3Columns: {
                contactColumns: [
                    {
                        columnId: 'Name',
                        nameColumnId: 'Name',
                        emailColumnId: 'Email',
                        intents: ['StartChat', 'ViewContact'],
                    },
                ],
                countryColumns: [
                    {
                        columnId: 'Country',
                        nameColumnId: 'Country',
                        isoalpha3ColumnId: 'CountryCode',
                        intents: ['ViewChart'],
                    },
                ],
                organizationColumns: [
                    {
                        columnId: 'Company',
                        nameColumnId: 'Company',
                        intents: ['ViewAnalysis', 'ViewNews'],
                    },
                ],
            },
        }),
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
                    Toolbars: ['SystemStatus'],
                },
            ],
        },
        Layout: {
            CurrentLayout: 'Basic Layout',
            Layouts: [
                {
                    Name: 'Basic Layout',
                    Columns: [
                        'Name',
                        'Year',
                        'Company',
                        'Country',
                        'CountryCode',
                        'Email',
                        'Rating',
                    ],
                },
            ],
        },
    },
};

const modules = [...AllEnterpriseModules];

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
                    console.log('Adaptable ready!');

                    adaptableApi.eventApi.on(
                        'FDC3MessageSent',
                        (eventInfo: AdaptableFDC3EventInfo) => {
                            if (eventInfo.eventType === 'RaiseIntent') {
                                const context = JSON.stringify(eventInfo.context);
                                const intent = JSON.stringify(eventInfo.intent);
                                switch (eventInfo.context.type) {
                                    case 'fdc3.contact':
                                        adaptableApi.systemStatusApi.setInfoSystemStatus(
                                            'Single Contact (' + intent + ')',
                                            context
                                        );
                                        break;
                                    case 'fdc3.contactList':
                                        adaptableApi.systemStatusApi.setSuccessSystemStatus(
                                            'Multiple Contacts (' + intent + ')',
                                            context
                                        );
                                        break;
                                    case 'fdc3.organization':
                                        adaptableApi.systemStatusApi.setWarningSystemStatus(
                                            'Organization (' + intent + ')',
                                            context
                                        );
                                        break;
                                    case 'fdc3.country':
                                        adaptableApi.systemStatusApi.setErrorSystemStatus(
                                            'Country (' + intent + ')',
                                            context
                                        );
                                        break;
                                }

                                const fdc3Api = getFDC3();
                                if(fdc3Api){
                                    fdc3Api.raiseIntent(eventInfo.intent, {afl:'tesr'});
                                }else{
                                    console.error('AdapTable: No fdc3 object available!')
                                }
                            }
                        }
                    );
                }}
                modules={modules}
            />
            <div className="ag-theme-balham" style={{ flex: 1 , height: 'calc(100vh - 40px)'}}>
                <AgGridReact gridOptions={gridOptions} modules={modules} />
            </div>
        </div>
    );
}


const getFDC3 = ()=>{
    return (globalThis as any).fdc3;
}