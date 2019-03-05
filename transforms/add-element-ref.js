/**
 *
 * It should convert this:
 *
 *   class SomeComponent extends React.Component {
 *   	componentDidMount() {
 *           this.element.focus()
 *   	}
 *
 *   	render() {
 *   		return (
 *   			<input />
 *   		);
 *   	}
 *   }
 *
 * To this:
 *
 *   class SomeComponent extends React.Component {
 *   	constructor(props) {
 *   		super(props);
 *   		this._elementRef = React.createRef();
 *   	}
 *
 *   	componentDidMount() {
 *   		this._elementRef.current.focus()
 *   	}
 *
 *   	render() {
 *   		return <input ref={this._elementRef} />;
 *   	}
 *   }
 *
 */

export default function transformer(file, api) {
	const j = api.jscodeshift;
	const root = j(file.source);

	root.find(j.ClassDeclaration).forEach(classDeclaration => {
		let elementReference = false;

		j(classDeclaration)
			.find(j.MemberExpression, {
				object: {type: 'ThisExpression'},
				property: {name: 'element'}
			})
			.forEach(path => {
				elementReference = true;

				j(path).replaceWith(
					j.memberExpression(
						j.memberExpression(
							j.thisExpression(),
							j.identifier('_elementRef')
						),
						j.identifier('current')
					)
				);
			});

		if (elementReference) {
			j(classDeclaration)
				.find(j.MethodDefinition, {key: {name: 'render'}})
				.forEach(renderMethod => {
					let addedRef = false;
					j(renderMethod)
						.find(j.ReturnStatement)
						.forEach(returnStatement => {
							j(returnStatement)
								.find(j.JSXOpeningElement)
								.forEach((item, index) => {
									if (
										index === 0 &&
										item.node.name.name[0].match(/[a-z]/)
									) {
										if (
											!item.node.attributes.some(
												item => item.name && item.name.name === 'ref'
											)
										) {
											addedRef = true;

											item.node.attributes.push(
												j.jsxAttribute(
													j.jsxIdentifier('ref'),
													j.jsxExpressionContainer(
														j.memberExpression(
															j.thisExpression(),
															j.identifier(
																'_elementRef'
															)
														)
													)
												)
											);
										}
									}
								});
						});
				});

			let constructor = j(classDeclaration).find(j.MethodDefinition, {
				key: {name: 'constructor'}
			});

			let createRefNode = j.expressionStatement(
				j.assignmentExpression(
					'=',
					j.memberExpression(
						j.thisExpression(),
						j.identifier('_elementRef')
					),
					j.callExpression(
						j.memberExpression(
							j.identifier('React'),
							j.identifier('createRef')
						),
						[]
					)
				)
			);

			if (!constructor.length) {
				classDeclaration.node.body.body.unshift(
					j.methodDefinition(
						'constructor',
						j.identifier('constructor'),
						j.functionExpression(
							null,
							[j.identifier('props')],
							j.blockStatement([
								j.expressionStatement(
									j.callExpression(j.identifier('super'), [
										j.identifier('props')
									])
								),
								createRefNode
							])
						)
					)
				);
			} else {
				constructor.forEach(item => {
					item.node.value.body.body.push(createRefNode);
				});
			}
		}
	});

	return root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto',
		reuseWhitespace: false
	});
}
