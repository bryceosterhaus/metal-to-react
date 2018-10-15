/**
 *
 * It should convert this:
 *
 *  import Component from 'metal-jsx';
 *
 *   function test() {
 *      return Component.renderToString(MyComponent, {
 *         title: 'test',
 *         value: someMethod()
 *      });
 *   }
 *
 * To this:
 *
 *   import ReactDOMServer from "react-dom/server";
 *   import Component from 'metal-jsx';
 *
 *
 *   function test() {
 *      return ReactDOMServer.renderToString(<MyComponent title='test' value={someMethod()} />);
 *   }
 *
 */

import {NEW_LINE_STRING, regexReplaceNewLine} from './utils/newline';

function buildJSXElement(j, componentName, props) {
	return j.jsxElement(
		j.jsxOpeningElement(
			j.jsxIdentifier(componentName),
			props.map(prop =>
				j.jsxAttribute(
					j.jsxIdentifier(prop.key.name),
					prop.value.type === 'Literal'
						? prop.value
						: j.jsxExpressionContainer(prop.value)
				)
			),
			true
		)
	);
}

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);
	let renderToStringUsed = false;

	root.find(j.CallExpression, {
		callee: {
			object: {name: 'Component'},
			property: {name: 'renderToString'}
		}
	}).forEach(path => {
		renderToStringUsed = true;

		path.node.callee.object.name = 'ReactDOMServer';

		const args = path.node.arguments;

		const component = args[0];
		const propsObj = args[1];

		path.node.arguments = [
			buildJSXElement(j, component.name, propsObj.properties)
		];
	});

	if (renderToStringUsed) {
		root.find(j.ImportDeclaration, {
			source: {value: 'metal-jsx'}
		})
			.insertBefore(
				j.importDeclaration(
					[j.importDefaultSpecifier(j.identifier('ReactDOMServer'))],
					j.literal('react-dom/server')
				)
			)
			.insertAfter(NEW_LINE_STRING);
	}

	const source = root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto',
		reuseWhitespace: false
	});

	return regexReplaceNewLine(source);
};
