/**
 *
 * It should convert this:
 *
		class App extends Component {
			render() {
				return <div className="test" />;
			}
		}

		class App2 extends Component {
			render() {
				return <div className={foobar} />
			}
		}


		class App3 extends Component {
			render() {
				return <div />
			}
		}
 *
 * To this:
		class App extends Component {
			render() {
				return <div className={"test" + ((this.props.elementClasses ? " " + this.props.elementClasses : ""))} />;
			}
		}

		class App2 extends Component {
			render() {
				return <div className={foobar + ((this.props.elementClasses ? " " + this.props.elementClasses : ""))} />;
			}
		}


		class App3 extends Component {
			render() {
				return (
				<div
					className={(this.props.elementClasses ? " " + this.props.elementClasses : "")} />
				);
			}
		}
 *
 */

export default function transformer(file, api) {
	const j = api.jscodeshift;

	const elementClassesExpression = j.memberExpression(
		j.memberExpression(j.thisExpression(), j.identifier('props')),
		j.identifier('elementClasses')
	);

	const elementClassesString = j.binaryExpression(
		'+',
		j.stringLiteral(' '),
		j.memberExpression(
			j.memberExpression(j.thisExpression(), j.identifier('props')),
			j.identifier('elementClasses')
		)
	);

	const elementClassesTernary = j.conditionalExpression(
		elementClassesExpression,
		elementClassesString,
		j.stringLiteral('')
	);

	const classNameAttribute = j.jsxAttribute(
		j.jsxIdentifier('className'),
		j.jsxExpressionContainer(elementClassesTernary)
	);

	const addToClassName = classNameAttr => {
		const prevVal = classNameAttr.value;

		if (prevVal.type === 'JSXExpressionContainer') {
			classNameAttr.value.expression = j.binaryExpression(
				'+',
				prevVal.expression,
				elementClassesTernary
			);
		} else if (prevVal.type === 'Literal') {
			classNameAttr.value = j.jsxExpressionContainer(
				j.binaryExpression('+', prevVal, elementClassesTernary)
			);
		}
	};

	return j(file.source)
		.find(j.MethodDefinition, {key: {name: 'render'}})
		.forEach(path => {
			j(path)
				.find(j.ReturnStatement)
				.forEach(path => {
					if (path.node.argument.type === 'JSXElement') {
						const firstElementOpening =
							path.node.argument.openingElement;

						if (firstElementOpening.name.name === 'svg') {
							return;
						}

						const classNameAttr = firstElementOpening.attributes.find(
							attr => attr.name && attr.name.name === 'className'
						);

						if (classNameAttr) {
							addToClassName(classNameAttr);
						} else {
							firstElementOpening.attributes.push(
								classNameAttribute
							);
						}
					}
				});
		})
		.toSource({
			objectCurlySpacing: false,
			useTabs: true,
			quote: 'auto',
			reuseWhitespace: false
		});
}
