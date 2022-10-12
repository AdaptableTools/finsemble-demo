import * as React from 'react';
// import Adaptable Component and other types
import AdaptableReact, {
  ActionColumnContext,
  AdaptableApi,
  AdaptableButton,
  AdaptableFDC3EventInfo,
  AdaptableMenuItem,
  AdaptableModule,
  AdaptableOptions,
  ContextMenuContext,
  FinancePluginOptions,
  FinsemblePluginOptions,
  GridCell,
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

const STATE_REVISION = 1665498873206;

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
  editOptions: {
    isCellEditable: (gridCell: GridCell) => {
      // No row where 'Language' is 'HTML'
      if (gridCell.rowNode.data['status'] !== 'In Progress') {
        return false;
      }
      return true;
    },
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
        name: 'About',
        title: 'About',
        toolbarButtons: [
          {
            label: 'Read Me',
            buttonStyle: {
              variant: 'outlined',
              tone: 'neutral',
            },
            onClick: (
              button: AdaptableButton<CustomToolbarButtonContext>,
              context: CustomToolbarButtonContext
            ) => {
              context.adaptableApi.settingsPanelApi.showCustomSettingsPanel('About AdapTable');
            },
          },
        ],
      },
      {
        name: 'My Trades',
        toolbarButtons: [
          {
            label: 'My Trades',
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
            label: 'All trades',
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
    actionHandlers: [
      {
        name: 'assignToMeAction',
        handler: (button, context) => {
          if (
            context.alert.alertType === 'rowChanged' &&
            context.alert.alertDefinition?.Rule?.Predicate?.PredicateId === 'AddedRow'
          ) {
            const addedRowNode = context.alert.gridDataChangedInfo?.rowNodes?.[0];
            if (addedRowNode) {
              const primaryKeyValue =
                context.adaptableApi.gridApi.getPrimaryKeyValueForRowNode(addedRowNode);
              context.adaptableApi.gridApi.setCellValue('user', CURRENT_USER, primaryKeyValue);
            }
          }
        },
      },
    ],
  },
  generalOptions: {
    customSortComparers: [
      {
        scope: {
          ColumnIds: ['pnl'],
        },
        comparer: (valueA: any, valueB: any) => {
          return Math.abs(valueB) - Math.abs(valueA);
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

    contextMenuItems: [
      {
        label: 'Assign to me',
        icon: {
          src: 'person',
          style: { margin: '5px' },
        },
        onClick: (menuContext: ContextMenuContext) => {
          menuContext.adaptableApi.gridApi.setCellValue(
            'user',
            CURRENT_USER,
            menuContext.primaryKeyValue
          );
        },
        hidden: (menuContext: ContextMenuContext) => {
          return (
            menuContext.rowNode.data['status'] !== 'In Progress' ||
            menuContext.rowNode.data['user'] === CURRENT_USER
          );
        },
      },
    ],
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
      Revision: STATE_REVISION,
      CurrentTheme: 'dark',
    },
    StatusBar: {
      Revision: STATE_REVISION,
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
      Revision: STATE_REVISION,
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
      Revision: STATE_REVISION,
      DashboardTitle: 'AdapTable',
      Tabs: [
        {
          Name: 'Demo',
          Toolbars: ['About', 'Layout', 'My Trades', 'Export', 'Query'],
        },
        {
          Name: 'FDC3',
          Toolbars: ['SystemStatus'],
        },
      ],
    },
    Layout: {
      Revision: STATE_REVISION,
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
    CustomSort: {
      Revision: STATE_REVISION,
      CustomSorts: [
        {
          ColumnId: 'user',
          SortedValues: [CURRENT_USER],
        },
      ],
    },
    Alert: {
      Revision: STATE_REVISION,
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
          AlertForm: {
            Buttons: [
              {
                Label: 'Show Me',
                ButtonStyle: {
                  variant: 'raised',
                  tone: 'info',
                },
                Action: ['highlight-row', 'jump-to-row'],
              },
              {
                Label: 'Assign Me',
                ButtonStyle: {
                  variant: 'outlined',
                  tone: 'accent',
                },
                Action: ['assignToMeAction', 'highlight-row', 'jump-to-row'],
              },
            ],
          },
        },
      ],
    },
    FlashingCell: {
      Revision: STATE_REVISION,
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
      Revision: STATE_REVISION,
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
            BooleanExpression: "[status] != 'In Progress'",
          },
        },
      ],
    },
    CalculatedColumn: {
      Revision: STATE_REVISION,
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
      Revision: STATE_REVISION,
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
      Revision: STATE_REVISION,
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
        onAdaptableReady={({ adaptableApi, gridOptions }) => {
          // save a reference to adaptable api
          adaptableApiRef.current = adaptableApi;

          const tradeDataGenerator = TradeDataGenerator.initialize(adaptableApi);

          // temporary hack, until https://github.com/AdaptableTools/adaptable/issues/1910 is fixed
          const positionCalCol =
            adaptableApi.calculatedColumnApi.getCalculatedColumnForColumnId('position');
          if (positionCalCol) {
            adaptableApi.calculatedColumnApi.editCalculatedColumn(positionCalCol);
          }

          gridOptions.columnApi?.autoSizeAllColumns();

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
