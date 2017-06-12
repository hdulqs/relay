/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 * @emails oncall+relay
 */

'use strict';

const RelayCompilerContext = require('RelayCompilerContext');
const RelayGenerateRequisiteFieldsTransform = require('RelayGenerateRequisiteFieldsTransform');
const RelayParser = require('RelayParser');
const RelayPrinter = require('RelayPrinter');
const RelayTestSchema = require('RelayTestSchema');

const getGoldenMatchers = require('getGoldenMatchers');
const { buildSchema } = require('graphql')

describe('RelayGenerateRequisiteFieldsTransform', () => {
  beforeEach(() => {
    expect.extend(getGoldenMatchers(__filename));
  });

  it('matches expected output', () => {
    expect(
      'fixtures/generate-requisite-fields-transform',
    ).toMatchGolden(text => {
      const ast = RelayParser.parse(RelayTestSchema, text);
      const context = ast.reduce(
        (ctx, node) => ctx.add(node),
        new RelayCompilerContext(RelayTestSchema),
      );
      const nextContext = RelayGenerateRequisiteFieldsTransform.transform(
        context,
      );
      const documents = [];
      nextContext.documents().map(doc => {
        documents.push(RelayPrinter.print(doc));
      });
      return documents.join('\n');
    });
  });

  it('inflects DataID field from Node interface', () => {
    const schema = buildSchema(`
      schema {
        query: Query
      }

      type Query {
        node(__id: ID): Node
        artists: [Artist]
      }

      interface Node {
        __id: ID!
      }

      type Artist implements Node {
        __id: ID!
        name: String!
      }
    `);
    const ast = RelayParser.parse(schema, `
      query ArtistsQuery {
        artists {
          name
        }
      }
    `)
    const context = ast.reduce(
      (ctx, node) => ctx.add(node),
      new RelayCompilerContext(RelayTestSchema)
    );
    const nextContext = RelayGenerateRequisiteFieldsTransform.transform(context);
    const documents = [];
    nextContext.documents().map(doc => {
      documents.push(RelayPrinter.print(doc));
    });
    expect(documents.join('\n')).toEqual(`
      query ArtistsQuery {
        artists {
          __id
          name
        }
      }
    `.replace(/^\s{6}/gm, '').trim())
  })
});
