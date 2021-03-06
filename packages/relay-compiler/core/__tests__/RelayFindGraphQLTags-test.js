/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+relay
 */

'use strict';

const RelayFindGraphQLTags = require('RelayFindGraphQLTags');
const FindGraphQLTags = require('FindGraphQLTags');

import type {GraphQLTagFinderOptions} from 'RelayFindGraphQLTags';

describe('RelayFindGraphQLTags', () => {
  function find(
    text,
    options: GraphQLTagFinderOptions,
    absPath: string = '/path/to/FindGraphQLTags.js',
  ) {
    return RelayFindGraphQLTags.find(
      FindGraphQLTags.find,
      text,
      absPath,
      options,
    );
  }

  describe('query validation', () => {
    it('prints correct file numbers in errors', () => {
      expect(() => {
        find(
          'const foo = 1;\n' +
            'foo(graphql`\n' +
            '  fragment FindGraphQLTags on User {\n' +
            '    ?\n' +
            '    id\n' +
            '  }\n' +
            '`);\n',
          {validateNames: true},
        );
      }).toThrow('Syntax Error: Cannot parse the unexpected character "?".');
    });
  });

  describe('query name validation', () => {
    it('throws for invalid query names', () => {
      expect(() =>
        find('graphql`query NotModuleName { me { id } }`;', {
          validateNames: true,
        }),
      ).toThrow(
        'FindGraphQLTags: Operation names in graphql tags must be prefixed with ' +
          'the module name and end in "Mutation", "Query", or "Subscription". ' +
          'Got `NotModuleName` in module `FindGraphQLTags`.',
      );
    });

    it('does not validate names when options is not set', () => {
      find('graphql`query NotModuleName { me { id } }`;', {
        validateNames: false,
      });
    });

    it('parses queries with valid names', () => {
      expect(
        find('graphql`query FindGraphQLTagsQuery { me { id } }`;', {
          validateNames: true,
        }),
      ).toEqual(['query FindGraphQLTagsQuery { me { id } }']);
    });

    it('parses queries with valid names from filepath', () => {
      expect(
        find(
          'graphql`query TestComponentQuery { me { id } }`;',
          {validateNames: true},
          './PathTo/SuperDuper/TestComponent.js',
        ),
      ).toEqual(['query TestComponentQuery { me { id } }']);
      expect(
        find(
          'graphql`query TestComponentQuery { me { id } }`;',
          {validateNames: true},
          './PathTo/SuperDuper/TestComponent.react.js',
        ),
      ).toEqual(['query TestComponentQuery { me { id } }']);
      expect(
        find(
          'graphql`query TestComponentQuery { me { id } }`;',
          {validateNames: true},
          './PathTo/SuperDuper/TestComponent.react.jsx',
        ),
      ).toEqual(['query TestComponentQuery { me { id } }']);
      expect(
        find(
          'graphql`query TestComponentQuery { me { id } }`;',
          {validateNames: true},
          './PathTo/SuperDuper/TestComponent/index.js',
        ),
      ).toEqual(['query TestComponentQuery { me { id } }']);
    });

    it('throws for invalid top-level fragment names', () => {
      expect(() =>
        find('graphql`fragment NotModuleName on User { name }`;', {
          validateNames: true,
        }),
      ).toThrow(
        'FindGraphQLTags: Fragment names in graphql tags ' +
          'must be prefixed with the module name. Got ' +
          '`NotModuleName` in module `FindGraphQLTags`.',
      );
    });

    it('parses top-level fragments with valid names', () => {
      expect(
        find('graphql`fragment FindGraphQLTags on User { name }`;', {
          validateNames: true,
        }),
      ).toEqual(['fragment FindGraphQLTags on User { name }']);
    });

    it('throws for invalid container fragment names', () => {
      expect(() =>
        find(
          `
          createFragmentContainer(Foo, {
            foo: graphql\`fragment FindGraphQLTags_notFoo on User { name }\`,
          });
        `,
          {validateNames: true},
        ),
      ).toThrow(
        'FindGraphQLTags: Container fragment names must be ' +
          '`<ModuleName>_<propName>`. Got `FindGraphQLTags_notFoo`, expected ' +
          '`FindGraphQLTags_foo`.',
      );
    });

    it('parses container fragments with valid names', () => {
      expect(
        find(
          `
          createFragmentContainer(Foo, {
            foo: graphql\`fragment FindGraphQLTags_foo on User { name }\`,
          });
        `,
          {validateNames: true},
        ),
      ).toEqual(['fragment FindGraphQLTags_foo on User { name }']);
    });
  });
});
