'use strict';
// Register the existing eight private-room interior filenames. Dry run unless --apply.
// Optional --repo, --game, --catalog and --record-dir paths allow isolated fixture runs.
const { register } = require('./register-batch.cjs');
const result = register({ directory: 'bg/interiors', include: /^(basic|standard|quality|luxury)_slave_room(_large1)?\.png$/i,
  eventPrefix: '20261110_private_room_interiors', backupDirectory: 'catalog-before-interiors', resultName: 'REGISTRATION_RESULT_interiors.json' });
console.log(JSON.stringify(result, null, 2));
