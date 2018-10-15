/**
 *
 * It should convert this:
 *
 *   import Component from 'metal-jsx';
 *
 *   Component.render(<App />, document.getElementById('foo'));
 *
 * To this:
 *
 *   import ReactDOM from "react-dom";
 *   import React from "react";
 *
 *   ReactDOM.render(<App />, document.getElementById('foo'));
 *
 */

import {NEW_LINE_STRING, regexReplaceNewLine} from './utils/newline';

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);
	let reactDomUsed = false;

	root.find(j.CallExpression, {
		callee: {object: {name: 'Component'}, property: {name: 'render'}}
	}).forEach(path => {
		reactDomUsed = true;

		path.node.callee.object.name = 'ReactDOM';
	});

	if (reactDomUsed) {
		root.find(j.ImportDeclaration, {
			source: {value: 'metal-jsx'}
		})
			.insertBefore(
				j.importDeclaration(
					[j.importDefaultSpecifier(j.identifier('ReactDOM'))],
					j.literal('react-dom')
				)
			)
			.insertBefore(
				j.importDeclaration(
					[j.importDefaultSpecifier(j.identifier('React'))],
					j.literal('react')
				)
			)
			.insertAfter(NEW_LINE_STRING)
			.remove();
	}

	const source = root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto',
		reuseWhitespace: false
	});

	return regexReplaceNewLine(source);
};
