/**
 *
 * It should convert this:
 *
 *   <div style="color: red;">
 *   </div>
 *
 * To this:
 *
 *   <div /* METAL_JSX_CODE_MOD: style="color: red;" *\/>
 *   </div>
 *
 */

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);

	root.find(j.JSXAttribute, {name: {name: 'style'}}).replaceWith(path =>
		j.block(' METAL_JSX_CODE_MOD: ' + j(path).toSource() + ' ')
	);

	return root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto',
		reuseWhitespace: false
	});
};
