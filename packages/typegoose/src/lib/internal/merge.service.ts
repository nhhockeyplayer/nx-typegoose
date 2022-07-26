import * as _ from 'lodash'

export class MergeService {
  static isSpreadable(val: object): boolean {
    const nonNullObject = val && _.isObject(val)

    return (
      nonNullObject &&
      Object.prototype.toString.call(val) !== '[object RegExp]' &&
      !_.isDate(val)
    )
  }

  static emptyTarget(val: object) {
    return _.isArray(val) ? [] : {}
  }

  static cloneIfNecessary(
    value: object,
    optionsArgument: { clone?: boolean }
  ): unknown {
    const clone = optionsArgument && optionsArgument.clone
    return clone && MergeService.isSpreadable(value)
      ? MergeService.deepMerge(
        MergeService.emptyTarget(value),
        value,
        optionsArgument
      )
      : value
  }

  static defaultArrayMerge(
    target: string | any[],
    source: any,
    optionsArgument: { clone?: boolean }
  ) {
    const destination = [...target.slice()]
    _.forEach(source, (value, key: any) => {
      if (typeof destination[key] === 'undefined') {

        destination[key] = MergeService.cloneIfNecessary(
          value,
          optionsArgument
        )
      } else if (MergeService.isSpreadable(value)) {
        destination[key] = MergeService.deepMerge(
          target[key],
          value,
          optionsArgument
        )
      } else if (target.indexOf(value) === -1) {
        destination.push(
          MergeService.cloneIfNecessary(value, optionsArgument)
        )
      }
    })
    return destination
  }

  static mergeObject(
    target: object,
    source: { [x: string]: any },
    optionsArgument: { clone?: boolean }
  ) {
    const destination = {}
    // angular.forEach eslint not enforcable here, leave as-is... it works
    if (MergeService.isSpreadable(target)) {
      Object.keys(target).forEach((key) => {
        destination[key] = MergeService.cloneIfNecessary(
          target[key],
          optionsArgument
        )
      })
    }
    Object.keys(source).forEach((key) => {
      if (!MergeService.isSpreadable(source[key]) || !target[key]) {
        destination[key] = MergeService.cloneIfNecessary(
          source[key],
          optionsArgument
        )
      } else {
        destination[key] = MergeService.deepMerge(
          target[key],
          source[key],
          optionsArgument
        )
      }
    })
    return destination
  }

  static deepMerge(
    target: object,
    source: object,
    optionsArgument: {
      clone?: boolean;
      arrayMerge?: (
        target: string | any[],
        source: any,
        optionsArgument: { clone?: boolean }
      ) => string | any[];
    }
  ) {
    const array = _.isArray(source)
    const options = optionsArgument || {
      arrayMerge: MergeService.defaultArrayMerge,
    }
    const arrayMerge = options.arrayMerge || MergeService.defaultArrayMerge

    if (array) {
      return _.isArray(target)
        ? arrayMerge(target, source, optionsArgument)
        : MergeService.cloneIfNecessary(source, optionsArgument)
    } else {
      return MergeService.mergeObject(target, source, optionsArgument)
    }
  }

  static deepMergeArray(
    array: any[],
    optionsArgument: {
      clone?: boolean | undefined;
      arrayMerge?:
        | ((
        target: string | any[],
        source: any,
        optionsArgument: { clone?: boolean }
      ) => string | any[])
        | undefined;
    }
  ) {
    if (!_.isArray(array) || array.length < 2) {
      throw new Error('first argument is invalid')
    }
    // we are sure there are at least 2 values, so it is safe to have no initial value
    return array.reduce((prev, next) => {
      return MergeService.deepMerge(prev, next, optionsArgument)
    })
  }

  static deepEquals(
    x: string | [] | Date | RegExp | (() => unknown) | any[] | null | undefined,
    y: string | [] | Date | RegExp | (() => unknown) | any[] | null | undefined
  ): any {
    if (x === null || x === undefined || y === null || y === undefined) {
      return x === y
    }
    // after this just checking type of one would be enough
    if (x.constructor !== y.constructor) {
      return false
    }
    // if they are functions, they should exactly refer to same one (because of closures)
    if (x instanceof Function) {
      return x === y
    }
    // if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
    if (x instanceof RegExp) {
      return x === y
    }
    if (x === y || x.valueOf() === y.valueOf()) {
      return true
    }
    if (_.isArray(y) && _.isArray(x) && x.length !== y.length) {
      return false
    }

    // if they are dates, they must had equal valueOf
    if (x instanceof Date) {
      return false
    }

    // if they are strictly equal, they both need to be object at least
    if (!(x instanceof Object)) {
      return false
    }
    if (!(y instanceof Object)) {
      return false
    }

    // recursive object equality check
    const p = Object.keys(x)
    return (
      Object.keys(y).every((i) => {
        return p.indexOf(i) !== -1
      }) &&
      p.every((i) => {
        return MergeService.deepEquals(x[i], y[i])
      })
    )
  }
}
