var FILLS = ['#006d2c', '#31a354', '#74c476', '#bae4b3', '#edf8e9'];
var LEGEND = ['4*', '3*', '2*', '1*', 'u/c'];
var BAR_WIDTH = 800;
var BAR_HEIGHT = 8;
var BAR_PAD = 1;

var pct = d3.format('.0%'); // % formatter for the tip

var chart = d3_rs_bars.html('refviewer').
width(BAR_WIDTH).
fill(FILLS).
legend(LEGEND).
orientation('left').
legendOrientation('top').
displayHtml(function (d, i) {return d.l + ', ' + LEGEND[i] + ', ' + (d.v[i] > 0 && d.v[i] < 1 ? pct(d.v[i]) : d.v[i]);}).
inset({
  left: 180,
  right: 0,
  top: 16,
  bottom: 0 });


function draw(data, animate) {
  chart.barSize(BAR_HEIGHT);
  chart.height(data.length * (BAR_HEIGHT + BAR_PAD) + chart.margin() + chart.inset().top + chart.inset().bottom + 40);

  var elm = d3.select('#elm').datum(data);
  if (animate === true) {
    elm = elm.transition();
  }
  elm.call(chart); // updating is a case of re-calling the chart
}

// helper to make the buttons exclusive
function makeOptions(ops, cb) {
  ops.forEach(function (n, i) {
    var node = d3.select(n);

    if (i === 0) {
      node.attr('class', 'danger');
    }

    node.on('click', function () {
      var isSet = node.classed('danger');
      if (isSet) return;

      isSet = !isSet;
      node.attr('class', isSet ? 'danger' : '');

      ops.forEach(function (p, j) {
        if (j !== i) {
          d3.select(ops[j]).attr('class', '');
        }
      });

      d3.event.stopPropagation();
      cb(i);
    });
  });
}

// massage the data into presentable structures
d3.tsv("https://raw.githubusercontent.com/redsift/d3-rs-bars/master/examples/institutions.txt", function (raw) {
  var lookup = {};
  // create lookups table of display values
  raw.forEach(function (d) {return lookup[d['Institution name']] = d['Display'];});

  // from: https://www.staff.city.ac.uk/~jwo/refviewer/data/RAE2008In2014Format.txt
  d3.tsv("https://raw.githubusercontent.com/redsift/d3-rs-bars/master/examples/RAE2008In2014Format.txt", function (raw) {
    var all = raw.map(function (d) {return {
        l: lookup[d['Institution name']],
        v: [parseInt(d['4*']), parseInt(d['3*']), parseInt(d['2*']), parseInt(d['1*']), parseInt(d['unclassified'])] };});


    // use the nest function to group
    var grouped = d3.nest().
    key(function (d) {return d.l;}).
    rollup(function (v) {return v.reduce(function (p, e) {
        for (var i = 0; i < 5; ++i) {
          p[i] = p[i] + e.v[i];
        };
        return p;
      }, [0, 0, 0, 0, 0]);}).
    entries(all).
    map(function (d) {return {
        l: d.key,
        v: d.value,
        t: d3.sum(d.value) };});


    var normal = grouped.map(function (e) {return {
        l: e.l,
        v: e.v.map(function (d) {return d / e.t;}) };});


    var staff = 0;
    var sort = 0;

    function update(animate) {
      var data = void 0;
      if (staff === 1) {
        data = grouped.slice();
      } else {
        data = normal.slice();
      }
      if (sort === 1) {
        data = data.sort(function (a, b) {return a.v[0] < b.v[0] ? 1 : a.v[0] > b.v[0] ? -1 : 0;});
      } else if (sort === 2) {
        data = data.sort(function (a, b) {return a.v[0] + a.v[1] < b.v[0] + b.v[1] ? 1 : a.v[0] + a.v[1] > b.v[0] + b.v[1] ? -1 : 0;});
      }

      draw(data, animate);
    }

    // draw initial state
    update(false);

    makeOptions(['#staff-pct', '#staff-count'], function (i) {return staff = i, update(true);});
    makeOptions(['#order-inst', '#order-4', '#order-43'], function (i) {return sort = i, update(true);});
  });
});