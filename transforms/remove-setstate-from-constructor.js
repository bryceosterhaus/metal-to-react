/**
 *
 * It should convert this:
 *
 *    class Test extends Component {
 *        constructor() {
 *            this.state = {one: 'test', two: {foo: 'bar'}}
 *        }
 *    }
 *
 * To this:
 *    class Test extends Component {
 *        constructor() {
 *            this.state = {one: 'test'}
 *        }
 *    }
 *
 */

export default function transformer(file, api) {
	const j = api.jscodeshift;
	const root = j(file.source);

	root.find(j.MethodDefinition, {key: {name: 'constructor'}}).forEach(
		methodPath => {
			j(methodPath)
				.find(j.CallExpression, {
					callee: {
						object: {type: 'ThisExpression'},
						property: {name: 'setState'}
					}
				})
				.forEach(path => {
					j(path).replaceWith(
						j.assignmentExpression(
							'=',
							j.memberExpression(
								j.thisExpression(),
								j.identifier('state')
							),
							path.node.arguments[0]
						)
					);
				});
		}
	);

	return root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto',
		reuseWhitespace: false
	});
}
