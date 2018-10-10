/**
 * A transform that converts this.state assignments to this.setState
 *
 * It should convert this:
 *
 *   this.state.foo = 'bar';
 *
 * To this:
 *
 *   this.setState({
 *     foo: 'bar'
 *   });
 *
 */

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);
	const addedCounts = new Map();

	root.find(j.ExpressionStatement, {
		expression: {
			left: {
				object: {
					object: {
						type: 'ThisExpression'
					}
				}
			},
			type: 'AssignmentExpression'
		}
	}).replaceWith(path => {
		const {node} = path;

		const propertyName = node.expression.left.property.name;

		const rightValue = node.expression.right;

		return j.expressionStatement(
			j.callExpression(
				j.memberExpression(
					j.identifier('this'),
					j.identifier('setState'),
					false
				),
				[
					j.objectExpression([
						j.property(
							'init',
							j.identifier(propertyName),
							rightValue
						)
					])
				]
			)
		);
	});

	return root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto'
	});
};
