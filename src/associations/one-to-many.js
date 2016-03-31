import joi from 'joi';
import error from '../error';
import _ from 'lodash';
import { parseInclude, parseWhere, getMethod } from '../utils';

let prefix;

export default (server, a, b, names, options) => {
  prefix = options.prefix;

  get(server, a, b, names);
  list(server, a, b, names);
  scope(server, a, b, names);
  scopeScope(server, a, b, names);
  destroy(server, a, b, names);
  destroyScope(server, a, b, names);
  update(server, a, b, names);
}

export const get = (server, a, b, names) => {
  server.route({
    method: 'GET',
    path: `${prefix}/${names.a.singular}/{aid}/${names.b.singular}/{bid}`,

    @error
    async handler(request, reply) {
      const include = parseInclude(request);

      const base = a.findOne({
        where: {
          id: request.params.aid
        }
      });

      const method = getMethod(base, names.b);
      const list = await method({ where: {
        id: request.params.bid
      }, include });

      reply(list);
    }
  })
}

export const list = (server, a, b, names) => {
  server.route({
    method: 'GET',
    path: `${prefix}/${names.a.singular}/{aid}/${names.b.plural}`,

    @error
    async handler(request, reply) {
      const include = parseInclude(request);
      const where = parseWhere(request);

      const base = await a.findOne({
        where: {
          id: request.params.aid
        }
      });

      const method = getMethod(base, names.b);
      const list = await method({ where, include });

      reply(list);
    }
  })
}

export const scope = (server, a, b, names) => {
  let scopes = Object.keys(b.options.scopes);

  server.route({
    method: 'GET',
    path: `${prefix}/${names.a.singular}/{aid}/${names.b.plural}/{scope}`,

    @error
    async handler(request, reply) {
      const include = parseInclude(request);
      const where = parseWhere(request);

      const base = await a.findOne({
        where: {
          id: request.params.aid
        }
      });

      const method = getMethod(base, names.b);
      const list = await method({
        scope: request.params.scope,
        where,
        include
      });

      reply(list);
    },

    config: {
      validate: {
        params: joi.object().keys({
          scope: joi.string().valid(...scopes),
          aid: joi.number().integer().required()
        })
      }
    }
  })
}

export const scopeScope = (server, a, b, names) => {
  let scopes = {
    a: Object.keys(a.options.scopes),
    b: Object.keys(b.options.scopes)
  };

  server.route({
    method: 'GET',
    path: `${prefix}/${names.a.plural}/{scopea}/${names.b.plural}/{scopeb}`,

    @error
    async handler(request, reply) {
      const include = parseInclude(request);
      const where = parseWhere(request);

      let list = await b.scope(request.params.scopeb).findAll({
        where,
        include: include.concat({
          model: a.scope(request.params.scopea)
        })
      })

      reply(list);
    },

    config: {
      validate: {
        params: joi.object().keys({
          scopea: joi.string().valid(...scopes.a),
          scopeb: joi.string().valid(...scopes.b)
        })
      }
    }
  })
}

export const destroy = (server, a, b, names) => {
  server.route({
    method: 'DELETE',
    path: `${prefix}/${names.a.singular}/{aid}/${names.b.plural}`,

    @error
    async handler(request, reply) {
      const include = parseInclude(request);
      const where = parseWhere(request);

      const base = await a.findOne({
        where: {
          id: request.params.aid
        }
      });

      const method = getMethod(base, names.b, true, 'destroy');
      const list = await method({ where, include });

      reply(list);
    }
  })
}

export const destroyScope = (server, a, b, names) => {
  let scopes = Object.keys(b.options.scopes);

  server.route({
    method: 'DELETE',
    path: `${prefix}/${names.a.singular}/{aid}/${names.b.plural}/{scope}`,

    @error
    async handler(request, reply) {
      const include = parseInclude(request);
      const where = parseWhere(request);

      const base = await a.findOne({
        where: {
          id: request.params.aid
        }
      });

      const method = getMethod(base, names.b, true, 'destroy');
      const list = await method({
        scope: request.params.scope,
        where,
        include
      });

      await* list.map(instance => instance.destroy());

      reply(list);
    },

    config: {
      validate: {
        params: joi.object().keys({
          scope: joi.string().valid(...scopes),
          aid: joi.number().integer().required()
        })
      }
    }
  });
}

export const update = (server, a, b, names) => {
  server.route({
    method: 'PUT',
    path: `${prefix}/${names.a.singular}/{aid}/${names.b.plural}`,

    @error
    async handler(request, reply) {
      const include = parseInclude(request);
      const where = parseWhere(request);

      const base = await a.findOne({
        where: {
          id: request.params.aid
        }
      });

      const method = getMethod(base, names.b);
      const list = await method({ where, include });

      await* list.map(instance => instance.update(request.payload));

      reply(list);
    }
  })
}
