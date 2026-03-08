window.LOCALES = window.LOCALES || {};
window.LOCALES['en'] = {
    // Conductor empty state
    'conductor.empty': 'Drag blocks here to get started',

    // Header
    'header.endTime': 'Estimated end',
    'header.totalDuration': 'Total duration',
    'header.connectionTitle': 'Connection status',

    // Top bar
    'topbar.showName.label': 'Show name',
    'topbar.showName.placeholder': 'Show title',
    'topbar.startTime.label': 'Start time',

    // Buttons
    'btn.clearDesc': '🧹 Clear Desc.',
    'btn.clearDesc.title': 'Clear description text only',
    'btn.clearAll': '🗑️ Clear all',
    'btn.clearAll.title': 'Clear everything',
    'btn.save': '💾 Save',
    'btn.save.title': 'Save (.json)',
    'btn.load': '📂 Open',
    'btn.load.title': 'Open (.json)',
    'btn.excel': '📤 Excel',
    'btn.excel.title': 'Export to ODS',
    'btn.print': '🖨️ Print / PDF',
    'btn.print.title': 'Print / PDF',
    'btn.share': '🔗 Share / Collaborate',
    'btn.share.title': 'Share or collaborate',
    'btn.lang.title': 'Change language',

    // Palette
    'palette.title': 'Blocks',
    'palette.reset.title': 'Reset block types',
    'palette.add.title': 'Add a block type',
    'palette.tip': '💡 <em>Right-click = edit block settings</em>',

    // Type Modal
    'modal.type.title': 'Manage Type',
    'modal.type.labelIcon': 'Icon (Emoji)',
    'modal.type.labelName': 'Block name',
    'modal.type.labelColor': 'Color',
    'modal.type.labelDuration': 'Default duration (mm:ss)',
    'modal.type.estimateDuration': 'Estimate duration from word count (155 wpm)',
    'modal.type.delete': 'Delete',
    'modal.type.cancel': 'Cancel',
    'modal.type.confirm': 'Save',

    // Share Modal
    'share.title': '🔗 Share / Collaborate',
    'share.close.title': 'Close',
    'share.cloud.title': 'Encrypted Cloud Backup',
    'share.cloud.desc': 'Generates a unique link to share the rundown. Data is encrypted; the server cannot read it.',
    'share.cloud.btn': '☁️ Generate share link',
    'share.cloud.placeholder': 'Generating link...',
    'share.cloud.copy.title': 'Copy link',
    'share.cloud.notice': '🔒 End-to-end encrypted. Link valid for 30 days. Changes are synced automatically.',
    'share.live.title': 'Live Collaboration',
    'share.live.desc': 'Work in real time with your collaborators.',
    'share.live.btn': '🤝 Start Live session',
    'share.live.placeholder': 'Generating link...',
    'share.live.copy.title': 'Copy link',
    'share.copy': '📋 Copy',
    'share.copied': '✅ Copied!',

    // Dynamic share button states
    'share.cloud.encrypting': '⏳ Encrypting...',
    'share.live.starting': '⏳ Starting...',
    'share.live.active': '🟢 Live session active',

    // Block
    'block.duration': 'Duration',
    'block.descPlaceholder': 'Description / Title / Content',
    'block.move.title': 'Move',
    'block.duplicate.title': 'Duplicate',
    'block.delete.title': 'Delete',

    // Confirms
    'confirm.deleteBlock': 'Delete this block?',
    'confirm.clearAll': 'Are you sure you want to clear all?',
    'confirm.clearDesc': 'Clear ALL description text?',
    'confirm.loadFile': 'Load this file?',
    'confirm.deleteType': 'Delete type "%s"?',
    'confirm.resetTypes': 'Reset all block types to defaults?',

    // Alerts
    'alert.noData': 'No data to export.',
    'alert.saveError': 'Error while saving: ',
    'alert.networkError': 'Network or encryption error.',
    'alert.liveError': 'Unable to start collaboration. Check your connection.',
    'alert.fileError': 'File error.',

    // Peer / collaboration
    'peer.collaborators': 'Collaborators: ',
    'peer.hostTitle': 'Active host — %n collaborator(s) connected',
    'peer.connecting': 'Connecting...',
    'peer.connected': 'Connected (session: %s)',

    // Page title
    'title.default': 'Radio Rundown - RadioTools.be',

    // Print
    'print.start': 'Start:',
    'print.end': 'End:',
    'print.duration': 'Duration:',
    'print.default': 'Rundown',

    // ODS Export columns
    'ods.time': 'Time',
    'ods.duration': 'Duration',
    'ods.type': 'Type',
    'ods.title': 'Title',
    'ods.description': 'Description',
    'ods.sheetName': 'Rundown',
    'ods.defaultName': 'Rundown',

    // Default types
    'default.types.sequence': 'Sequence',
    'default.types.speak': 'Speak',
    'default.types.pub': 'Ad',
    'default.types.musique': 'Music',
    'default.types.autre': 'Other',
};
