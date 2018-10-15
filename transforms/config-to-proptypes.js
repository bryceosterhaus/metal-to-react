/**
 * A transform that converts metal.js state and props to react state and props.
 *
 * STATE and PROPS must be static methods on class for this transform to work.
 */

import {addComment} from './utils/addComment';
import {isPrimitiveType} from './utils/isPrimitiveType';
import {isStateProperty} from './utils/isStateProperty';

function isConfigObject(node) {
	return node.callee.object && node.callee.object.name === 'Config';
}

function setDefaultProps(j, path) {
	const propNames = [];
	const defaultProps = new Map();

	let className;

	j(path)
		.closest(j.ClassDeclaration)
		.forEach(item => {
			if (item.node.id) {
				className = item.node.id.name;
			} else {
				className = item.node.id;
			}
		});

	path.node.value.properties.forEach(node => {
		const parentNode = node;

		j(parentNode)
			.find(j.CallExpression, {callee: {property: {name: 'value'}}})
			.forEach(path => {
				const {node} = path;

				if (node.arguments.length && parentNode === path.parent.node) {
					propNames.push(parentNode.key.name);

					defaultProps.set(parentNode.key.name, node.arguments);
				}
			})
			.replaceWith(({node}) => {
				return node.callee.object;
			});
	});

	if (defaultProps.size) {
		j(path)
			.closestScope()
			.find(
				className ? j.ClassDeclaration : j.ClassExpression,
				className
					? {
							id: {name: className}
					  }
					: {}
			)
			.forEach(path => {
				path.node.body.body.splice(
					0,
					null,
					j.classProperty(
						j.identifier('defaultProps'),
						j.objectExpression(
							propNames.map(propName =>
								j.property(
									'init',
									j.identifier(propName),
									...defaultProps.get(propName)
								)
							)
						),
						null,
						true
					)
				);
			});
	}
}

function renameToPropTypes(root, j) {
	root.find(j.CallExpression, {callee: {object: {name: 'Config'}}}).forEach(
		path => {
			const {node} = path;

			if (isPrimitiveType(node.callee.property.name)) {
				j(path).replaceWith(() =>
					j.memberExpression(
						j.identifier('PropTypes'),
						j.identifier(node.callee.property.name),
						false
					)
				);
			} else {
				if (node.callee.property.name === 'shapeOf') {
					node.callee.property.name = 'shape';
				}

				node.callee.object.name = 'PropTypes';
			}
		}
	);
}

function renameRequired(j, node) {
	j(node)
		.find(j.CallExpression, {callee: {property: {name: 'required'}}})
		.replaceWith(({node}) =>
			j.memberExpression(
				node.callee.object,
				j.identifier('isRequired'),
				false
			)
		);
}

const OTHER_CONFIG_HELPERS = [
	'setter',
	'valueFn',
	'validator',
	'inRange',
	'writeOnly',
	'internal'
];

function addCommentsForOtherFn(j, node) {
	j(node)
		.find(j.CallExpression)
		.filter(
			({node}) =>
				node.callee &&
				node.callee.property &&
				OTHER_CONFIG_HELPERS.includes(node.callee.property.name)
		)
		.forEach(({node}) => {
			addComment(
				j,
				node,
				'.setter(' + j(node.arguments).toSource() + ')'
			);
		})
		.replaceWith(path => path.node.callee.object);
}

function setDefaultStateValues(j, node) {
	j(node)
		.find(j.CallExpression, {callee: {property: {name: 'value'}}})
		.replaceWith(({node}) => node.arguments);

	j(node)
		.find(j.CallExpression, {callee: {object: {name: 'Config'}}})
		.replaceWith(() => j.identifier('undefined'));

	j(node)
		.find(j.CallExpression, {callee: {property: {name: 'required'}}})
		.replaceWith(path => path.node.callee.object);
}

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);

	renameToPropTypes(root, j);

	root.find(j.ClassProperty)
		.filter(path => isStateProperty(path.node.key.name))
		.forEach(path => {
			const {node} = path;

			// Transform PROPS to propTypes and defaultProps
			if (path.node.key.name === 'PROPS') {
				setDefaultProps(j, path);

				renameRequired(j, node);

				addCommentsForOtherFn(j, path.parent.node);

				node.key.name = 'propTypes';
			}

			// Transform STATE to state
			if (path.node.key.name === 'STATE') {
				addCommentsForOtherFn(j, path.parent.node);

				setDefaultStateValues(j, node);

				node.key.name = 'state';
			}
		})
		.map(path => path.parent);

	// Remove any unused PropType imports
	if (!root.find(j.MemberExpression, {object: {name: 'PropTypes'}}).length) {
		root.find(j.ImportDeclaration, {
			source: {value: 'prop-types'}
		}).remove();
	}

	return root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto'
	});
};
