import { ColDef } from '@ag-grid-enterprise/all-modules';

export const columnDefs: ColDef[] = [
  {
    headerName: 'Id',
    field: 'EmployeeId',
    editable: false,
    sortable: true,
    type: 'abColDefString',
  },
  {
    headerName: 'Name',
    field: 'Name',
    filter: true,
    sortable: true,
    type: 'abColDefString',
  },
  {
    headerName: 'Year',
    field: 'Year',
    filter: true,
    sortable: true,
    type: 'abColDefNumber',
  },
  {
    headerName: 'Company',
    field: 'Company',
    filter: true,
    sortable: true,
    type: 'abColDefString',
  },
  {
    headerName: 'Country',
    field: 'Country',
    filter: true,
    sortable: true,
    type: 'abColDefString',
  },
  {
    headerName: 'CountryCode',
    field: 'CountryCode',
    filter: true,
    sortable: true,
    type: 'abColDefString',
  },
  {
    headerName: 'Email',
    field: 'Email',
    filter: true,
    sortable: true,
    type: 'abColDefString',
  },
  {
    headerName: 'Rating',
    field: 'Rating',
    filter: true,
    sortable: true,
    type: 'abColDefNumber',
  },
];
