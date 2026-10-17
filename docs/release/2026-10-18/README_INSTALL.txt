JO9 2.4 simplified patch installer

This package contains personal patch files. Install the required base game and external packs first. Their NPC files and artwork are not supplied by this installer. Close the game before installation.

Keep this patch in a separate extracted folder. In PowerShell run:

  powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\Install-Patch.ps1" -GameDirectory "D:\Games\My JO9\game" -DryRun

GameDirectory is the folder containing your jack.qsp. It may be on another drive or have a different folder name. -DryRun and -WhatIf validate the complete package and recipient without writing files. Remove -DryRun to install.

The installer verifies every BUILD_MANIFEST.json payload file by SHA-256 and size. It refuses missing required sources, changed/corrupt payload files, unsafe paths, reparse/junction traversal, external slaves/*.json or slave_index.json payloads, and original artwork in the artificial-original namespace. Optional prerequisites.json lists external images which must already be present; their contents are not replaced or hash-restricted.

Optional resource-map.json supplies verified receiver-only aliases. The release map has 111 destinations: 109 reserve paths copied from the receiver's canonical DB_BG files and two regular paths copied from the receiver's old SNKmod paths. Existing destinations are retained. Missing destinations require their listed source files during preflight; all aliases are copied and hash-checked before payload overwrites. Source files are retained. This metadata contains no art and does not obtain files from the sender's original game. The release map has no dependency chains or overlap with the personal payload or preserved-original mapping paths.

Before overwriting any patch file, it backs up every changed existing payload file. Before the first image overwrite, it copies the recipient's current original image to the corresponding content/jo9o_original_cuts path. Existing files at those original paths are preserved. Repeated mappings to the same target are copied once; conflicting source contents are refused. The shipped map has 238 source/target records. The upstream map's 282 reservations include 44 missing-original reservations without source/target files, which are not required originals.

original-mirror-map.json has 238 receiver-only copies from these preserved originals to physical content/pic/... (2).ext files. Each source must be a declared original-map target. Preflight accepts either its existing file or the original planned from the receiver's pre-patch canonical art. Copies run after original preservation and before the personal payload, so an existing legacy original supplies (2) even when the current canonical image is already personal. This map contains paths only; external original artwork is not shipped. Existing (2) files are retained only when their SHA-256 matches the preserved original. A different existing (2) stops installation before backups or game writes; retain that file and review the conflict before retrying. The installer never overwrites an existing (2), promotes it to (3), or changes your own additional cut files. Maps cannot write a physical original over a payload or resource-map destination. No mirror chains or general dependency graph are used.

If an original target is absent and the current source already matches this package's personal image SHA, installation stops before writing anything. Restore the pre-patch source from your backup or restore your own saved original target, then retry. Images from other previous patches cannot always be recognized. This installer never obtains originals from JO9O, another installation, or the internet.

Backups are stored in JO9_patch_backups/<UTC timestamp + unique suffix>, beside the installation folder. For example D:\Games\My JO9\game uses D:\Games\JO9_patch_backups. -BackupDirectory "E:\JO9 backups" selects a different backup parent; a location inside the recipient installation is refused. The final JSON output gives the exact backupDirectory.

Rollback: retain the entire backup directory. rollback.json records destination paths, prior and installed SHA values, which files had prior copies, and completed steps. With the game closed, compare current installed files with the recorded installed hashes; if they still match, copy each backups/files/<relative> file back over the same <relative> path under GameDirectory. Verify the copied files against oldSha256. Do not overwrite a file changed after installation without reviewing that change. Newly created payload, resource-alias, preserved-original and physical-original mirror files have no previous file to copy back; restoring their prior absence would require a separate reviewed removal. This installer does not delete or move files, and rollback does not remove NPC packs, saves, or existing originals.

Preflight failures create no backup or game files. A failure after writes begin reports PARTIAL_RESTORE_REQUIRED in rollback.json. Review every planned files entry, including completed=false: a failed or interrupted copy may already have changed some destination bytes before completion is recorded. Restore affected existing payload files from their retained backups after reviewing current hashes. Planned new payload/original paths may likewise contain partial files even if completed/created=false; restoring prior absence requires separate reviewed removal. All prior overwritten files are backed up before recipient modifications begin. Filesystem permissions, disk exhaustion, hardware failures and concurrent changes can still stop installation; a multi-file copy is not an atomic transaction. Run the dry check and install without changing package/game files in between.

Inputs and dependencies: Windows PowerShell 5.1 or later, standard .NET, this script, BUILD_MANIFEST.json, original-map.json, package game/ payload; prerequisites.json is optional. No Node.js is needed by this installer. Startup only installs requested payload files; it does not run the game or edit saves. Reinstalling an identical package with all preserved originals present returns ALREADY_INSTALLED without creating another backup.

The release also supplies optional included-saves/1.sav through included-saves/7.sav outside game/. Copy a chosen save manually only if you want to use it. The installer never automatically installs these saves, external NPC slaves JSON files or slave_index.json.

Package maintainer contract:
  BUILD_MANIFEST.json: {"files":[{"path":"game/path/to/file","sha256":"64 hexadecimal digits","bytes":123}]}
  original-map.json: {"version":1,"mappings":[{"source":"content/pic/example.png","target":"content/jo9o_original_cuts/example.png"}]}
  original-mirror-map.json: {"version":1,"mappings":[{"source":"content/jo9o_original_cuts/example.png","target":"content/pic/example (2).png"}]}
  prerequisites.json: {"files":[{"path":"content/pic/external-required.png","requiredPresence":true}]}
  resource-map.json: {"version":1,"mappings":[{"source":"content/pic/bg/DB_BG/example.png","target":"content/pic/reserve/bg/DB_BG/example.png"}]}

Only manifest-listed game/ payload files and the receiver-only copies declared by the three maps are installed. Installer/readme/manifest/map/prerequisites metadata stay in the patch folder. Both alias maps are optional for generic packages; this release includes resource-map.json and original-mirror-map.json. Exclude test fixtures, test scripts, source copies and development logs from the distributed package.
