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
  DashboardButtonContext,
  AdaptableButton,
  ActionColumnContext,
} from '@adaptabletools/adaptable-react-aggrid';

// import agGrid Component
import { AgGridReact } from '@ag-grid-community/react';

import { RECOMMENDED_MODULES } from './agGridModules';

import finance from '@adaptabletools/adaptable-plugin-finance';
import finsemble from '@adaptabletools/adaptable-plugin-finsemble';

import { CURRENT_USER, TradeDataGenerator } from './TradeDataGenerator';
import { AboutPanelComponent } from './AboutPanel';
import { PredicateDefHandlerParams } from '@adaptabletools/adaptable/src/PredefinedConfig/Common/AdaptablePredicate';
import { CustomToolbarButtonContext } from '@adaptabletools/adaptable/src/AdaptableOptions/DashboardOptions';
import { ColumnFilter } from '@adaptabletools/adaptable/src/types';

const hiddenContextMenus: AdaptableModule[] = [
  'CellSummary',
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

const financeOptions: FinancePluginOptions = {
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
};

// build the AdaptableOptions object
// in this example we are NOT passing in predefined config but in the real world you will ship the AdapTable with objects and permissions
const adaptableOptions: AdaptableOptions = {
  primaryKey: 'tradeId',
  licenseKey: process.env.REACT_APP_ADAPTABLE_LICENSE_KEY,
  userName: CURRENT_USER,
  adaptableId: 'finsemble-adaptable-demo',
  plugins: [finance(financeOptions), finsemble(finsembleOptions)],
  layoutOptions: {
    autoSizeColumnsInLayout: true,
  },
  userInterfaceOptions: {
    editLookUpItems: [
      {
        scope: {
          ColumnIds: ['book', 'user'],
        },
      },
    ],
  },
  actionOptions: {
    actionRowButtons: ['edit'],
    actionColumns: [
      {
        columnId: 'changeStatus',
        // leave whitespace!!
        friendlyName: ' ',
        actionColumnButton: [
          {
            icon: {
              name: 'clear',
            },
            tooltip: 'Reject',
            hidden: (
              button: AdaptableButton<ActionColumnContext>,
              context: ActionColumnContext
            ) => {
              return context.rowNode?.data?.status !== 'In Progress';
            },
            onClick: (
              button: AdaptableButton<ActionColumnContext>,
              context: ActionColumnContext
            ) => {
              context.adaptableApi.gridApi.setCellValue(
                'status',
                'Rejected',
                context.primaryKeyValue
              );
            },
            buttonStyle: {
              variant: 'outlined',
              tone: 'warning',
            },
          },
          {
            icon: {
              name: 'check',
            },
            tooltip: 'Complete',
            hidden: (
              button: AdaptableButton<ActionColumnContext>,
              context: ActionColumnContext
            ) => {
              return context.rowNode?.data?.status !== 'In Progress';
            },
            onClick: (
              button: AdaptableButton<ActionColumnContext>,
              context: ActionColumnContext
            ) => {
              context.adaptableApi.gridApi.setCellValue(
                'status',
                'Completed',
                context.primaryKeyValue
              );
            },
            buttonStyle: {
              variant: 'outlined',
              tone: 'success',
            },
          },
        ],
      },
    ],
  },
  exportOptions: {
    appendFileTimestamp: true,
    exportDateFormat: 'yyyy-dd-MM',
    exportFormatType: 'formattedValue',
  },
  dashboardOptions: {
    customToolbars: [
      {
        name: 'My Trades',
        toolbarButtons: [
          {
            label: 'Show my trades',
            buttonStyle: {
              variant: 'raised',
              tone: 'accent',
            },
            hidden: (
              button: AdaptableButton<CustomToolbarButtonContext>,
              context: CustomToolbarButtonContext
            ) => {
              return (
                context.adaptableApi.filterApi.getColumnFilter('user')?.Predicate?.PredicateId ===
                'currentUser'
              );
            },
            onClick: (
              button: AdaptableButton<CustomToolbarButtonContext>,
              context: CustomToolbarButtonContext
            ) => {
              const myTradesFilters: ColumnFilter[] = [
                {
                  ColumnId: 'user',
                  Predicate: {
                    PredicateId: 'currentUser',
                  },
                },
              ];
              context.adaptableApi.filterApi.setColumnFilter(myTradesFilters);
            },
          },
          {
            label: 'Show all trades',
            buttonStyle: {
              variant: 'outlined',
              tone: 'accent',
            },
            hidden: (
              button: AdaptableButton<CustomToolbarButtonContext>,
              context: CustomToolbarButtonContext
            ) => {
              return !context.adaptableApi.filterApi.getColumnFilter('user');
            },
            onClick: (
              button: AdaptableButton<CustomToolbarButtonContext>,
              context: CustomToolbarButtonContext
            ) => {
              context.adaptableApi.filterApi.clearColumnFilterByColumn('user');
            },
          },
        ],
      },
    ],
  },
  adaptableQLOptions: {
    expressionOptions: {
      customQueryVariables: {
        currentUser: CURRENT_USER,
      },
    },
    customPredicateDefs: [
      {
        id: 'currentUser',
        label: 'Current User',
        moduleScope: ['filter'],
        columnScope: {
          ColumnIds: ['user'],
        },
        handler: (params: PredicateDefHandlerParams) => {
          if (typeof params.value === 'string' && params.value.includes('Finsemble')) {
            return true;
          }
          return false;
        },
      },
    ],
  },
  menuOptions: {
    // remove some menu items to keep things easier
    showAdaptableColumnMenu: (menuItem: AdaptableMenuItem) => {
      return !hiddenContextMenus.includes(menuItem.module as AdaptableModule);
    },
    showAdaptableContextMenu: (menuItem: AdaptableMenuItem) => {
      return !hiddenContextMenus.includes(menuItem.module as AdaptableModule);
    },
  },
  settingsPanelOptions: {
    customSettingsPanels: [
      {
        name: 'About AdapTable',
        frameworkComponent: AboutPanelComponent,
      },
    ],
    navigation: {
      items: [
        'About AdapTable',
        '-',
        'Dashboard',
        'ToolPanel',
        'StateManagement',
        '-',
        'Alert',
        'CalculatedColumn',
        'CustomSort',
        'DataSet',
        'Export',
        'Filter',
        'FlashingCell',
        'FormatColumn',
        'FreeTextColumn',
        'Layout',
        'PlusMinus',
        'Query',
        'QuickSearch',
        'Schedule',
        'Shortcut',
        'StyledColumn',
        '-',
        'GridInfo',
        'SystemStatus',
        'DataChangeHistory',
        'TeamSharing',
        'Theme',
      ],
    },
  },
  predefinedConfig: {
    Theme: {
      Revision: Date.now(),
      CurrentTheme: 'dark',
    },
    StatusBar: {
      Revision: Date.now(),
      StatusBars: [
        {
          Key: 'Center Panel',
          StatusBarPanels: ['Alert'],
        },
        {
          Key: 'Right Panel',
          StatusBarPanels: ['Layout'],
        },
      ],
    },
    Export: {
      Revision: Date.now(),
      Reports: [
        {
          Name: 'My Live Trades',
          Scope: {
            ColumnIds: [
              'tradeId',
              'direction',
              'ticker',
              'cusip',
              'clientName',
              'book',
              'tradeDate',
              'settlementDate',
              'currency',
              'totalPrice',
              'pnl',
              'position',
            ],
          },
          ReportColumnScope: 'ScopeColumns',
          ReportRowScope: 'ExpressionRows',
          Query: {
            BooleanExpression: "[user] = VAR('currentUser') AND [status] = 'In Progress'",
          },
        },
      ],
      CurrentReport: 'My Live Trades',
      CurrentDestination: 'Excel',
    },
    Dashboard: {
      Revision: Date.now(),
      DashboardTitle: 'AdapTable',
      Tabs: [
        {
          Name: 'Demo',
          Toolbars: ['Layout', 'My Trades', 'Export'],
        },
      ],
    },
    Layout: {
      Revision: Date.now(),
      CurrentLayout: 'Trade View',
      Layouts: [
        {
          Name: 'Trade View',
          Columns: [
            'tradeId',
            'user',
            'direction',
            'ticker',
            'cusip',
            'description',
            'status',
            'changeStatus',
            'marketPrice',
            'pnl',
            'position',
            'totalPrice',
            'fill',
            'clientName',
            'book',
            'currency',
            'rating',
            'tradeDate',
            'settlementDate',

            // 'quantity',
            // 'unitPrice',
            // 'commission',
            // 'fees',
          ],
        },
        {
          Name: 'Price View',
          Columns: [
            'tradeId',
            'user',
            'direction',
            'ticker',
            // 'cusip',
            // 'description',
            'clientName',
            'book',
            // 'rating',
            'tradeDate',
            'settlementDate',
            'status',
            // 'currency',
            'marketPrice',
            'pnl',
            'position',
            'totalPrice',
            'quantity',
            'unitPrice',
            'commission',
            'fees',
          ],
        },
        {
          Name: 'User View',
          Columns: [
            'tradeId',
            // 'user',
            'direction',
            // 'ticker',
            // 'cusip',
            // 'description',
            'clientName',
            'book',
            'rating',
            'tradeDate',
            'settlementDate',
            'status',
            'currency',
            'marketPrice',
            'pnl',
            'position',
            'totalPrice',
            'quantity',
            'unitPrice',
            'commission',
            'fees',
          ],
          RowGroupedColumns: ['user', 'ticker'],
        },
        {
          Name: 'Pivot View',
          Columns: [],
          RowGroupedColumns: ['ticker'],
          EnablePivot: true,
          PivotColumns: ['direction'],
          SuppressAggFuncInHeader: true,
          AggregationColumns: {
            pnl: 'sum',
            position: 'sum',
          },
        },
      ],
    },
    Alert: {
      Revision: Date.now(),
      AlertDefinitions: [
        {
          Scope: {
            All: true,
          },
          Rule: {
            Predicate: {
              PredicateId: 'AddedRow',
            },
          },
          MessageType: 'Info',
          AlertProperties: {
            DisplayNotification: true,
          },
          AlertForm: {
            Buttons: [
              {
                Label: 'OK',
                ButtonStyle: {
                  variant: 'outlined',
                  tone: 'neutral',
                },
              },
              {
                Label: 'Show Me',
                ButtonStyle: {
                  variant: 'raised',
                  tone: 'info',
                },
                Action: ['highlight-row', 'jump-to-row'],
              },
            ],
          },
        },
      ],
    },
    FlashingCell: {
      Revision: Date.now(),
      FlashingCellDefinitions: [
        {
          Scope: {
            ColumnIds: ['marketPrice'],
          },
          Rule: {
            Predicate: {
              PredicateId: 'Any',
            },
          },
          DownChangeStyle: {
            BackColor: '#FF0000',
            ForeColor: '#000000',
          },
          UpChangeStyle: {
            BackColor: '#32cd32',
            ForeColor: '#000000',
          },
          NeutralChangeStyle: {
            BackColor: '#808080',
          },
          FlashDuration: 500,
          FlashTarget: 'cell',
        },
      ],
    },
    FormatColumn: {
      Revision: Date.now(),
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
        {
          Scope: {
            ColumnIds: ['pnl', 'position'],
          },
          Style: {
            ForeColor: '#ff0000',
          },
          DisplayFormat: {
            Formatter: 'NumberFormatter',
            Options: {
              Parentheses: true,
              FractionDigits: 2,
            },
          },
          Rule: {
            Predicate: {
              PredicateId: 'Negative',
            },
          },
        },
        {
          Scope: {
            ColumnIds: [
              'totalPrice',
              'unitPrice',
              'fees',
              'marketPrice',
              'commission',
              'pnl',
              'position',
            ],
          },
          DisplayFormat: {
            Formatter: 'NumberFormatter',
            Options: {
              FractionDigits: 2,
            },
          },
          CellAlignment: 'Right',
          IncludeGroupedRows: true,
        },
        {
          Scope: {
            ColumnIds: ['pnl', 'position'],
          },
          Style: {
            ForeColor: '#32cd32',
          },
          Rule: {
            Predicate: {
              PredicateId: 'Positive',
            },
          },
        },
        {
          Scope: {
            All: true,
          },
          Style: {
            ForeColor: '#969696',
            FontStyle: 'Italic',
          },
          Rule: {
            BooleanExpression: "[status] = 'Rejected'",
          },
        },
      ],
    },
    CalculatedColumn: {
      Revision: Date.now(),
      CalculatedColumns: [
        {
          ColumnId: 'totalPrice',
          Query: {
            ScalarExpression: '[quantity] * [unitPrice] - [fees] - [commission] ',
          },
          CalculatedColumnSettings: {
            DataType: 'Number',
            Filterable: true,
            Resizable: true,
            Groupable: true,
            Sortable: true,
            Pivotable: false,
            Aggregatable: true,
            SuppressMenu: false,
            SuppressMovable: false,
          },
          FriendlyName: 'Total Price',
        },
        {
          ColumnId: 'netPrice',
          Query: {
            ScalarExpression: '[quantity] * [unitPrice]',
          },
          CalculatedColumnSettings: {
            DataType: 'Number',
            Filterable: true,
            Resizable: true,
            Groupable: true,
            Sortable: true,
            Pivotable: false,
            Aggregatable: true,
            SuppressMenu: false,
            SuppressMovable: false,
          },
          FriendlyName: 'Net Price',
        },
        {
          ColumnId: 'pnl',
          FriendlyName: 'PnL',
          Query: {
            ScalarExpression: `[direction] = 'Buy' ? [netPrice] - ([marketPrice] * [quantity]) : [netPrice]  + ([marketPrice] * [quantity])`,
          },
          CalculatedColumnSettings: {
            DataType: 'Number',
            Filterable: true,
            Resizable: true,
            Groupable: true,
            Sortable: true,
            Pivotable: true,
            Aggregatable: true,
            SuppressMenu: false,
            SuppressMovable: false,
          },
        },
        {
          ColumnId: 'position',
          Query: {
            AggregatedScalarExpression: 'SUM([pnl] ,GROUP_BY([ticker] ) ) ',
          },
          CalculatedColumnSettings: {
            DataType: 'Number',
            Filterable: true,
            Resizable: true,
            Groupable: true,
            Sortable: false,
            Pivotable: true,
            Aggregatable: true,
            SuppressMenu: false,
            SuppressMovable: false,
          },
          FriendlyName: 'Position',
        },
      ],
    },
    StyledColumn: {
      Revision: Date.now(),
      StyledColumns: [
        {
          ColumnId: 'totalPrice',
          GradientStyle: {
            CellRanges: [
              {
                Min: 'Col-Min',
                Max: 'Col-Max',
                Color: '#a52a2a',
              },
            ],
          },
        },
        {
          ColumnId: 'fill',
          PercentBarStyle: {
            CellRanges: [
              {
                Min: 0,
                Max: 100,
                Color: '#006400',
              },
            ],
            CellText: ['PercentageValue'],
          },
        },
      ],
    },
  },
};

const modules = RECOMMENDED_MODULES;

export const AdaptableAgGrid = () => {
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
          fdc3Api?.addIntentListener('ViewChart', (context: any) => {
            const { type } = context;

            console.log(context);

            adaptableApi.systemStatusApi.setInfoSystemStatus(
              'FDC3 Intent (' + type + ')',
              JSON.stringify(context)
            );
          });

          adaptableApi.eventApi.on('FDC3MessageSent', (eventInfo: AdaptableFDC3EventInfo) => {
            if (eventInfo.eventType === 'RaiseIntent') {
              const fdc3Api = getFDC3();
              if (fdc3Api) {
                console.log('Raising intent: ', eventInfo.intent, eventInfo.context);
                fdc3Api.raiseIntent(eventInfo.intent, eventInfo.context);
              } else {
                console.error('AdapTable: No fdc3 object available!');
              }
            }
          });
        }}
      />
      <div className="ag-theme-balham" style={{ flex: 1, height: 'calc(100vh - 40px)' }}>
        <AgGridReact gridOptions={gridOptions} modules={modules} />
      </div>
    </div>
  );
};

const getFDC3 = () => {
  return (globalThis as any).fdc3;
};
