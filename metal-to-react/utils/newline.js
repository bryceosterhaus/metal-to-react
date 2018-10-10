export const NEW_LINE_STRING = '__CODE_MOD_NEW_LINE_STRING__';

export const regexReplaceNewLine = source =>
	source.replace(new RegExp('^\\s+' + NEW_LINE_STRING + '$', 'gm'), '');
