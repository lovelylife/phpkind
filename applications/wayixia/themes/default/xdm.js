
 Q.Ready(function() {
  var a = new easyXDM.Rpc(
    {
      local: "/qlib/thirdparty/easyXDM-2-4-17-1/name.html",
      swf: "/qlib/thirdparty/easyXDM-2-4-17-1/easyxdm.swf"
    },
    {
      local: {
        request: function(a, b, c) {
          //var d = a.method || "get";
          //d.toLowerCase(),
          a.oncomplete = b,
          a.onerror = c;
          Q.Ajax(a);
        }
      },

      serializer: {
        parse: Q.json_decode,
        stringify: Q.json_encode
      }
    });
});
