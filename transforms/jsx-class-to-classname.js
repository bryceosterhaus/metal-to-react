/**
 *
 * It should convert this:
 *
 *   <div class="test">
 *   </div>
 *
 * To this:
 *
 *   <div className="test">
 *   </div>
 *
 */

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);

	root.find(j.JSXAttribute, {name: {name: 'class'}}).forEach(path => {
		path.node.name.name = 'className';
	});

	return root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto',
		reuseWhitespace: false
	});
};
