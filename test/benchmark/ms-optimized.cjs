const Benchmark = require('benchmark');
const benchmarks = require('beautify-benchmark');
const originMS = require('ms');
const { ms } = require('../..');

const suite = new Benchmark.Suite();

// Test various common formats
const testCases = [
  '10s',
  '5m',
  '1h',
  '2d',
  '1w',
  '1y',
  '100ms',
  '30 seconds',
  '15 minutes',
  '1.5h',
  '0.5d',
];

// add tests
suite
  .add('origin ms() - single format', function() {
    originMS('10s');
  })
  .add('ms() - single format', function() {
    ms('10s');
  })
  .add('ms() - number passthrough', function() {
    ms(1000);
  })
  .add('origin ms() - varied formats', function() {
    for (const format of testCases) {
      originMS(format);
    }
  })
  .add('ms() - varied formats (with caching)', function() {
    for (const format of testCases) {
      ms(format);
    }
  })
  .add('ms() - repeated format (cache hit)', function() {
    ms('10s');
    ms('10s');
    ms('10s');
  })
  .add('origin ms() - fast path formats', function() {
    originMS('1s');
    originMS('5m');
    originMS('2h');
    originMS('3d');
  })
  .add('ms() - fast path formats', function() {
    ms('1s');
    ms('5m');
    ms('2h');
    ms('3d');
  })

// add listeners
  .on('cycle', function(event) {
    benchmarks.add(event.target);
  })
  .on('start', function() {
    console.log('\n  node version: %s, date: %s\n  Starting...', process.version, Date());
  })
  .on('complete', function() {
    benchmarks.log();
    console.log('\n--- Performance Summary ---');

    // Calculate improvements
    const results = {};
    this.forEach((bench) => {
      results[bench.name] = bench.hz;
    });

    const singleFormatImprovement = ((results['ms() - single format'] - results['origin ms() - single format']) / results['origin ms() - single format'] * 100).toFixed(2);
    const variedFormatsImprovement = ((results['ms() - varied formats (with caching)'] - results['origin ms() - varied formats']) / results['origin ms() - varied formats'] * 100).toFixed(2);
    const fastPathImprovement = ((results['ms() - fast path formats'] - results['origin ms() - fast path formats']) / results['origin ms() - fast path formats'] * 100).toFixed(2);

    console.log(`Single format improvement: ${singleFormatImprovement}%`);
    console.log(`Varied formats improvement: ${variedFormatsImprovement}%`);
    console.log(`Fast path formats improvement: ${fastPathImprovement}%`);
  })
// run async
  .run({ async: false });
