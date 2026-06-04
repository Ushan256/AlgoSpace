export function operationsForClass(timeClass, n) {
  const size = Math.max(1, Number(n) || 1);
  if (timeClass === 'O(1)') return 1;
  if (timeClass === 'O(log n)') return Math.max(1, Math.floor(Math.log2(Math.max(size, 2))));
  if (timeClass === 'O(n)') return size;
  if (timeClass === 'O(n log n)') {
    return Math.max(1, Math.floor(size * Math.log2(Math.max(size, 2))));
  }
  if (timeClass === 'O(n²)' || timeClass === 'O(n^2)') return size * size;
  if (timeClass === 'O(n³)' || timeClass === 'O(n^3)') return size ** 3;
  return size;
}

export function idealTimeComplexity(timeClass) {
  const map = {
    'O(n³)': 'O(n²)',
    'O(n^3)': 'O(n²)',
    'O(n²)': 'O(n log n)',
    'O(n^2)': 'O(n log n)',
    'O(n log n)': 'O(n)',
    'O(n)': 'O(log n)',
    'O(log n)': 'O(1)',
    'O(1)': 'O(1)',
  };
  return map[timeClass] || 'O(1)';
}

export function buildIdealCoordinates(idealClass, userCoordinates) {
  if (!userCoordinates || userCoordinates.length === 0) return [];
  return userCoordinates.map((point) => ({
    input_size: point.input_size,
    operations: operationsForClass(idealClass, point.input_size),
  }));
}

export function buildDenseCurve(timeClass, minN, maxN, pointCount = 24) {
  const coords = [];
  const steps = Math.max(pointCount - 1, 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const inputSize = Math.max(minN, Math.round(minN + (maxN - minN) * t));
    coords.push({
      input_size: inputSize,
      operations: operationsForClass(timeClass, inputSize),
    });
  }
  return coords;
}

export function formatOperations(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('en-US');
}

export function getBurdenLevel(operations) {
  if (operations < 1000000) {
    return {
      level: 'safe',
      label: 'Safe Load',
      colorClass: 'burden-badge-safe',
    };
  }
  if (operations < 100000000) {
    return {
      level: 'heavy',
      label: 'Heavy Load',
      colorClass: 'burden-badge-heavy',
    };
  }
  return {
    level: 'critical',
    label: 'Critical Load',
    colorClass: 'burden-badge-critical',
  };
}

export function getOptimizationGap(userOps, idealOps) {
  const gap = Math.max(0, userOps - idealOps);
  return {
    gap,
    ratio: idealOps > 0 ? (userOps / idealOps).toFixed(2) : '∞',
  };
}
