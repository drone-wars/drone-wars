import battle from './battle.js';

const query = new URLSearchParams(document.location.search);

const numAggressors = parseInt(query.get('num-aggressors'), 10) || 0;
const numAvoiders = parseInt(query.get('num-avoiders'), 10) || 0;
const numWanderers = parseInt(query.get('num-wanderers'), 10) || 0;

async function start() {
  const res = await fetch('/robots-data');

  if (!res.ok) {
    throw new Error(`Unexpected status: ${res.status}`);
  }

  const { robots } = await res.json();

  battle({
    customRobots: robots,
    numAggressors,
    numAvoiders,
    numWanderers
  });
}

start();
