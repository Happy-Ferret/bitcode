'use strict';

const bitcode = require('./');
const constants = bitcode.constants;

const BLOCK = constants.BLOCK;
const RECORD = constants.RECORD;

const TYPE_ABBR_WIDTH = 6;

class TypeTable {
  constructor() {
    this.cache = new Map();
    this.list = [];
  }

  cachedType(key, value) {
    if (this.cache.has(key))
      return this.cache.get(key);

    const res = this.list.length;
    this.cache.set(key, res);
    this.list.push(value);
    return res;
  }

  getVoid() {
    return this.cachedType('void', { type: 'void' });
  }

  getInt(width) {
    return this.cachedType('i' + width, { type: 'int', width });
  }

  // TODO(indutny): address space
  getPointerTo(type) {
    return this.cachedType('p' + type, { type: 'ptr', to: type });
  }

  // TODO(indutny): varag
  getFunction(ret, params) {
    return this.cachedType('f' + ret + ':' + params.join(':'),
      { type: 'fn', ret, params });
  }

  serializeTo(stream) {
    stream.enterBlock(BLOCK.TYPE, TYPE_ABBR_WIDTH);

    stream.writeUnabbrevRecord(RECORD.TYPE_CODE_NUMENTRY, [ this.list.length ]);

    // TODO(indutny): abbreviate
    this.list.forEach((entry) => {
      if (entry.type === 'void') {
        stream.writeUnabbrevRecord(RECORD.TYPE_CODE_VOID, []);
      } else if (entry.type === 'int') {
        stream.writeUnabbrevRecord(RECORD.TYPE_CODE_INTEGER, [ entry.width ]);
      } else if (entry.type === 'ptr') {
        stream.writeUnabbrevRecord(RECORD.TYPE_CODE_POINTER, [ entry.to ]);
      } else if (entry.type === 'fn') {
        stream.writeUnabbrevRecord(RECORD.TYPE_CODE_FUNCTION,
          [ 0, entry.ret ].concat(entry.params));
      } else {
        throw new Error('Unsupported type: ' + entry.type);
      }
    });

    stream.endBlock();
  }
}
module.exports = TypeTable;