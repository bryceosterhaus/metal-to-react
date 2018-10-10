/**
 * A transform that converts metal lifecycle names to react lifecycles
 * and for any lifecycle that does not map one-to-one, prepend "FIXME_".
 *
 * It should convert this:
 *
 *    class extends Component {
 *       created() {}
 *
 *       detached() {}
 *    }
 *
 * To this:
 *
 *    class extends Component {
 *       constructor(props) {
 *          super(props);
 *       }
 *
 *       FIXME_detached() {}
 *    }
 *
 */

import {NEW_LINE_STRING, regexReplaceNewLine} from './utils/newline';

const NAME_MAP = {
	attached: 'componentDidMount',
	created: 'constructor',
	detached: true,
	disposed: true,
	prepareStateForRender: 'getDerivedStateFromProps',
	rendered: 'componentDidUpdate',
	shouldUpdate: 'shouldComponentUpdate',
	willAttach: true,
	willDetach: 'componentWillUnmount',
	willReceiveProps: true,
	willReceiveState: true,
	willUpdate: true
};

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);
	const addedCounts = new Map();

	root.find(j.ClassDeclaration).forEach(path => {
		const {node} = path.parent;

		j(path)
			.find(j.MethodDefinition)
			.forEach(({node}) => {
				const name = node.key.name;

				if (NAME_MAP.hasOwnProperty(name)) {
					node.key.name =
						NAME_MAP[name] === true
							? 'FIXME_' + name
							: NAME_MAP[name];

					if (NAME_MAP[name] === 'constructor') {
						node.value.params.push(j.identifier('props'));

						const superExpression = j.expressionStatement(
							j.callExpression(j.identifier('super'), [
								j.identifier('props')
							])
						);

						node.value.body.body.unshift(NEW_LINE_STRING);

						node.value.body.body.unshift(superExpression);
					}
				}
			});
	});

	const source = root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto'
	});

	return regexReplaceNewLine(source);
};
