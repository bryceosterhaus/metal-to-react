/**
 * A transform that adds comments to uses of elementClasses
 *
 * It should convert this:
 *
 *   <MyComponent
 *      elementClasses="test"
 *      items={[
 *         {
 *            foo: 'bar',
 *            elementClasses: 'baz'
 *         }
 *      ]}
 *    >
 *   </MyComponent>
 *
 * To this:
 *   /* METAL_JSX_CODE_MOD: elementClasses="test" *\/
 *   <MyComponent
 *      items={[
 *         /* METAL_JSX_CODE_MOD: elementClasses="baz" *\/
 *         {
 *            foo: 'bar'
 *         }
 *      ]}
 *   >
 *   </MyComponent>
 *
 */

import {addComment} from './utils/addComment';

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);

	root.find(j.JSXAttribute, {name: {name: 'elementClasses'}}).replaceWith(
		path => j.block(' METAL_JSX_CODE_MOD: ' + j(path).toSource() + ' ')
	);

	root.find(j.JSXElement)
		.find(j.Property, {key: {name: 'elementClasses'}})
		.forEach(path => {
			addComment(j, path.parent.node, j(path).toSource());
		})
		.remove();

	return root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto',
		reuseWhitespace: false
	});
};
