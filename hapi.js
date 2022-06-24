function hapi(server, dataset, parameters, start, stop, cb, opts) {
/*

  Usage:

    hapi(server, dataset, parameters, start, stop, cb, opts)

    `cb`` is a function that passed a `data`` and `metadata`` object.

    `opts` is an object with keys of

      `raw` [false] - Return JSON object as returned by server

      `jsTimeNumber` [false] - Add a parameter to the returned data that is the number of ms since 1970-01-01.

      `jsDateObject` [false] - Add a parameter to the returned data that is a Javascript Date object 

      `renameTime` [false] - Rename the first variable to `Time`.

  Example: 

    cb = function(data, meta) {console.log(data); console.log(meta)}
    opts = {'renameTime': true, 'raw': false, 'jsTimeNumber': false, 'jsDateObject': false};
    hapi('http://hapi-server.org/servers/TestData2.0/hapi',
         'dataset1','scalar','1970-01-01Z','1970-01-01T00:00:10.000Z',cb,opts);

*/

  opts = opts || {};
  opts.raw = opts.raw || false;
  opts.renameTime = opts.renameTime || false;
  opts.jsTimeNumber = opts.jsTimeNumber || false;
  opts.jsDateObject = opts.jsDateObject || false;

  let url = server
            + "/data"
            + "?id=" + dataset
            + "&parameters=" + parameters
            + "&time.min=" + start
            + "&time.max=" + stop
            + "&format=json"
            + "&include=header";

  console.log("Getting " + url);
  fetch(url).then(res => res.json()).then(process);

  function process(json) {
    // Reformat so structure matches Python, MATLAB, etc. output variable structures.
    let data = {};
    let po; // parameter object
    let timeName = json['parameters'][0]['name'];
    if (opts.renameTime) {
      json['parameters'][0]['name'] = 'Time';
      timeName = 'Time';
    }
    if (opts.raw) {
      cb(json);
      return;
    }
    json.parameters.forEach((po,idx) => {
      console.log(po['size'])

      pn = po['name']; // parameter name
      data[pn] = [];          
      json.data.forEach(row => {
        data[pn].push(row[idx]);
      });
    });
    // TODO: Could use one loop if jsTimeNumber and jsDateObject are both true.
    // Could also integrate into loop above.
    if (opts.jsTimeNumber) {
      data['jsTimeNumber'] = hapitime2jsTimeNumber(data['Time']); 
    }
    if (opts.jsDateObject) {
      data['jsDateObject'] = hapitime2jsDateObject(data['Time']); 
    }
    delete json.data;
    cb(data, json);
  }
}

function hapitime2jsTimeNumber(dts) {
  t = []; dts.forEach(dt => {t.push(moment(dt).valueOf());});
  return t;
}

function hapitime2jsDateObject(dts) {
  t = []; dts.forEach(dt => {t.push(moment(dt)._d);});
  return t;
}
