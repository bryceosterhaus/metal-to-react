const PRIMATIVE_TYPES = [
	'array',
	'bool',
	'func',
	'number',
	'object',
	'string',
	'any'
];

export const isPrimitiveType = propertyName =>
	PRIMATIVE_TYPES.includes(propertyName);
