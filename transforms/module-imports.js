/**
 *
 * It should convert this:
 *
 *   import Component, {Config} from 'metal-jsx';
 *   import {connect} from 'metal-redux;
 *
 * To this:
 *
 *   import {PropTypes} from "prop-types";
 *   import React from "react";
 *   import {connect} from "react-redux";
 *
 */

import {addComment} from './utils/addComment';

const NAME_MAP = {
	'metal-jsx': 'react',
	'metal-redux': 'react-redux'
};

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);

	root.find(j.ImportDeclaration).forEach(path => {
		const {node} = path;

		if (NAME_MAP[node.source.value]) {
			// Perform specific operations if the import is from 'metal-jsx'
			if (node.source.value === 'metal-jsx') {
				// Check if user is importing 'Config' and replace with PropTypes
				if (
					j(node).find(j.ImportSpecifier, {
						imported: {name: 'Config'}
					}).length
				) {
					path.parent.node.body.splice(
						0,
						null,
						j.importDeclaration(
							[j.importSpecifier(j.identifier('PropTypes'))],
							j.literal('prop-types')
						)
					);
				}

				if (
					j(node).find(j.ImportDefaultSpecifier, {
						local: {name: 'Component'}
					}).length
				) {
					node.specifiers[0].local.name = 'React';
					node.specifiers = [node.specifiers[0]];

					// Replace instances where a class is extending from Component
					root.find(j.ClassDeclaration, {
						superClass: {name: 'Component'}
					}).forEach(path => {
						path.node.superClass.name = 'React.Component';
					});
					root.find(j.ClassExpression, {
						superClass: {name: 'Component'}
					}).forEach(path => {
						path.node.superClass.name = 'React.Component';
					});
				} else {
					j(path).remove();
				}
			}

			node.source.value = NAME_MAP[node.source.value];
		} else if (node.source.value.match(/metal\-.*/)) {
			addComment(j, node, 'CHECK IMPORT BELOW');
		}
	});

	// Find instances where a file may export 'Config' from 'metal-jsx'
	root.find(j.ExportNamedDeclaration, {source: {value: 'metal-jsx'}})
		.filter(
			path =>
				j(path).find(j.ExportSpecifier, {
					local: {name: 'Config'}
				}).length
		)
		.replaceWith(
			j.exportNamedDeclaration(
				null,
				[
					j.exportSpecifier(
						j.identifier('PropTypes'),
						j.identifier('PropTypes')
					)
				],
				j.literal('prop-types')
			)
		);

	return root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto'
	});
};
