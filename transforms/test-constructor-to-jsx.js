/**
 *
 * It should convert this:
 *
 *    component = new Button({name: "foo", bar: {qux: 1}});
 *
 *    expect(component).toMatchSnapshot();
 *
 * To this:
 *    import * as TestRenderer from 'react-test-renderer';
 *
 *    const component = TestRenderer.create(<Button name={"foo"} bar={{qux: 1}} />);
 *
 *    expect(component.toJSON()).toMatchSnapshot();
 *
 */

export default function transformer(file, api) {
	const j = api.jscodeshift;
	const root = j(file.source);

	if (root.find(j.CallExpression, {callee: {name: 'describe'}}).length) {
		let usedTestRenderer = false;

		root.find(j.ExpressionStatement, {
			expression: {
				left: {name: 'component'},
				right: {type: 'NewExpression'}
			}
		}).forEach(path => {
			usedTestRenderer = true;

			j(path).replaceWith(
				j.variableDeclaration('const', [
					j.variableDeclarator(
						j.identifier('component'),
						j.callExpression(
							j.memberExpression(
								j.identifier('TestRenderer'),
								j.identifier('create')
							),
							[
								j.jsxElement(
									j.jsxOpeningElement(
										path.node.expression.right.callee
											.type === 'Identifier'
											? j.jsxIdentifier(
													path.node.expression.right
														.callee.name
											  )
											: j.jsxMemberExpression(
													j.jsxIdentifier(
														path.node.expression
															.right.callee.object
															.name
													),
													j.jsxIdentifier(
														path.node.expression
															.right.callee
															.property.name
													)
											  ),
										path.node.expression.right
											.arguments[0] &&
											path.node.expression.right
												.arguments[0].properties
											? path.node.expression.right.arguments[0].properties.map(
													item => {
														return j.jsxAttribute(
															j.jsxIdentifier(
																item.key.name
															),
															j.jsxExpressionContainer(
																item.value
															)
														);
													}
											  )
											: [],
										true
									)
								)
							]
						)
					)
				])
			);
		});

		root.find(j.CallExpression, {
			arguments: [{name: 'component'}],
			callee: {name: 'expect'}
		}).forEach(path => {
			path.node.arguments[0] = j.callExpression(
				j.memberExpression(
					j.identifier('component'),
					j.identifier('toJSON')
				),
				[]
			);
		});

		if (usedTestRenderer) {
			root.find(j.Program).forEach(item => {
				item.node.body = [
					j.importDeclaration(
						[
							j.importNamespaceSpecifier(
								j.identifier('TestRenderer')
							)
						],
						j.literal('react-test-renderer')
					),
					...item.node.body
				];
			});
		}
	}

	return root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto',
		reuseWhitespace: false
	});
}
