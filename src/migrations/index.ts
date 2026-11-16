import * as migration_20261115_194019_initial from './20261115_194019_initial';
import * as migration_20261115_204047_blob_storage_fields from './20261115_204047_blob_storage_fields';
import * as migration_20261116_125612_applications_toggle from './20261116_125612_applications_toggle';

export const migrations = [
  {
    up: migration_20261115_194019_initial.up,
    down: migration_20261115_194019_initial.down,
    name: '20261115_194019_initial',
  },
  {
    up: migration_20261115_204047_blob_storage_fields.up,
    down: migration_20261115_204047_blob_storage_fields.down,
    name: '20261115_204047_blob_storage_fields',
  },
  {
    up: migration_20261116_125612_applications_toggle.up,
    down: migration_20261116_125612_applications_toggle.down,
    name: '20261116_125612_applications_toggle'
  },
];
