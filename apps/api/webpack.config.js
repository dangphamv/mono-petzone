module.exports = function (options) {
  const originalExternals = options.externals || []
  const externalsArray = Array.isArray(originalExternals)
    ? originalExternals
    : [originalExternals]

  return {
    ...options,
    externals: externalsArray.map((ext) => {
      if (typeof ext !== 'function') return ext
      return function (ctx, callback) {
        if (ctx.request && ctx.request.startsWith('@petzone/')) {
          return callback()
        }
        return ext.call(this, ctx, callback)
      }
    }),
  }
}
