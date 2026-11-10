'use strict';
// Register private-room cutscenes. Dry run unless --apply; default paths remain the real WORK/catalog.
// Optional --repo, --game, --catalog and --record-dir paths allow isolated fixture runs.
const { register } = require('./register-batch.cjs');
const result = register({ directory: 'scene/home', include: /\.png$/i,
  eventPrefix: '20261110_private_room_duty_scenes', backupDirectory: 'catalog-before', resultName: 'REGISTRATION_RESULT.json' });
console.log(JSON.stringify(result, null, 2));
