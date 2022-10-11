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
import { RowHighlightInfo } from '@adaptabletools/adaptable/src/PredefinedConfig/Common/RowHighlightInfo';
import { AdaptableRowChangedAlert } from '@adaptabletools/adaptable/src/PredefinedConfig/Common/AdaptableAlert';

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
    instrumentColumns: [
      {
        columnId: 'instrument',
        nameColumnId: 'Instrument',
        tickerColumnId: 'ticker',
        cusipColumnId: 'cusip',
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
  notificationsOptions: {
    duration: 10000,
    closeWhenClicked: true,
  },
  alertOptions: {
    alertForms: [
      {
        name: 'newTradeAlertForm',
        form: {
          buttons: [
            {
              label: 'Show Me',
              buttonStyle: {
                variant: 'raised',
                tone: 'info',
              },
              onClick: (button, context) => {
                const addedRowNode = (context.alert as AdaptableRowChangedAlert).gridDataChangedInfo
                  ?.rowNodes?.[0];
                if (addedRowNode) {
                  const primaryKeyValue =
                    context.adaptableApi.gridApi.getPrimaryKeyValueForRowNode(addedRowNode);
                  const info: RowHighlightInfo = {
                    primaryKeyValue,
                    timeout: 2000,
                    highlightStyle: {
                      BackColor: `var(--ab-color-info)`,
                    },
                  };
                  context.adaptableApi.gridApi.highlightRow(info);
                  context.adaptableApi.gridApi.jumpToRow(primaryKeyValue);
                }
              },
            },
            {
              label: 'Assign to Me',
              buttonStyle: {
                variant: 'raised',
                tone: 'success',
              },
              onClick: (button, context) => {
                const addedRowNode = (context.alert as AdaptableRowChangedAlert).gridDataChangedInfo
                  ?.rowNodes?.[0];
                if (addedRowNode) {
                  const primaryKeyValue =
                    context.adaptableApi.gridApi.getPrimaryKeyValueForRowNode(addedRowNode);
                  const info: RowHighlightInfo = {
                    primaryKeyValue,
                    timeout: 2000,
                    highlightStyle: {
                      BackColor: `var(--ab-color-info)`,
                    },
                  };

                  context.adaptableApi.gridApi.setCellValue('user', CURRENT_USER, primaryKeyValue);
                  context.adaptableApi.gridApi.highlightRow(info);
                  context.adaptableApi.gridApi.jumpToRow(primaryKeyValue);
                }
              },
            },
          ],
        },
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
          StatusBarPanels: ['Alert', 'SystemStatus'],
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
              'instrument',
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
          Toolbars: ['Layout', 'My Trades', 'Export', 'Query'],
        },
        {
          Name: 'FDC3',
          Toolbars: ['SystemStatus'],
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
            'instrument',
            'ticker',
            'cusip',
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
            // 'instrument',
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
            // 'instrument',
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
          MessageText: 'New Trade',
          MessageType: 'Info',
          AlertProperties: {
            DisplayNotification: true,
          },
          AlertForm: 'newTradeAlertForm',
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
    Query: {
      NamedQueries: [
        {
          Name: 'Live $ Trades',
          BooleanExpression: "[currency] = 'USD' AND [status] = 'In Progress'",
        },
        {
          Name: 'Settling soon',
          BooleanExpression:
            "DIFF_DAYS([settlementDate], NOW() ) <= 7 AND [status] = 'In Progress'",
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

          adaptableApi.eventApi.on('FDC3MessageSent', (eventInfo: AdaptableFDC3EventInfo) => {
            if (eventInfo.eventType === 'BroadcastMessage') {
              console.log(eventInfo);
              adaptableApi.systemStatusApi.setInfoSystemStatus(
                `Broadcasting ${eventInfo?.context?.id?.ticker} ${eventInfo?.context?.id?.CUSIP}`,
                JSON.stringify(eventInfo.context)
              );
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
