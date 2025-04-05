export class OnlineLogisticRegression {
  weights: number[];
  bias: number;
  lr: number;
  onUpdate: (params: { weights: number[]; bias: number }) => void;

  constructor(
    numFeatures: number,
    learningRate = 0.01,
    onUpdate: typeof this.onUpdate
  ) {
    this.weights = Array(numFeatures).fill(0); // Initialize weights
    this.bias = 0;
    this.lr = learningRate;
    this.onUpdate = onUpdate; // callback to update weights in React state
  }

  // Sigmoid activation
  sigmoid(z: number) {
    return 1 / (1 + Math.exp(-z));
  }

  // Predict probability
  predict(features: number[]) {
    const z = this.weights.reduce(
      (sum, w, i) => sum + w * features[i],
      this.bias
    );
    return this.sigmoid(z);
  }

  // Single step of online gradient descent
  train(features: number[], label: number) {
    const prediction = this.predict(features);
    const error = prediction - label;

    // Gradient update
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] -= this.lr * error * features[i];
    }
    this.bias -= this.lr * error;

    // Call the provided callback to update the state in React
    if (this.onUpdate) {
      this.onUpdate({
        weights: this.weights,
        bias: this.bias,
      });
    }
  }
}
