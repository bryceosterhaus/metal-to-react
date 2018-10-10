/**
 * A transform that converts class attribute to className
 *
 * It should convert this:
 *
 *   class foo {
 *      static state = {}
 *   }
 *
 * To this:
 *
 *   class foo {
 *      state = {}
 *   }
 *
 */

module.exports = (file, api) => {
	const j = api.jscodeshift;

	return j(file.source)
		.find(j.ClassProperty, {static: true, key: {name: 'state'}})
		.forEach(path => (path.node.static = false))
		.toSource({
			objectCurlySpacing: false,
			useTabs: true,
			quote: 'auto',
			reuseWhitespace: false
		});
};
