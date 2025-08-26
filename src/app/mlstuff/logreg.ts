export type FeatureVector = Record<string, number>;

export class OnlineLogisticRegression {
  private weights: FeatureVector = {};
  private bias: number = 0;
  private learningRate: number;
  onUpdate: (params: { weights: FeatureVector; bias: number }) => void;

  constructor(learningRate = 0.01, onUpdate: typeof this.onUpdate) {
    this.learningRate = learningRate;
    this.onUpdate = onUpdate;
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  private dotProduct(features: FeatureVector): number {
    let sum = this.bias;
    for (const [key, value] of Object.entries(features)) {
      const weight = this.weights[key] ?? 0;
      sum += weight * value;
    }
    return sum;
  }

  public predict(features: FeatureVector): number {
    return this.sigmoid(this.dotProduct(features));
  }

  public update(features: FeatureVector, label: 0 | 1): void {
    const prediction = this.predict(features);
    const error = label - prediction;

    for (const [key, value] of Object.entries(features)) {
      if (!(key in this.weights)) {
        this.weights[key] = 0;
      }
      this.weights[key] += this.learningRate * error * value;
    }

    this.bias += this.learningRate * error;

    this.onUpdate({
      weights: this.weights,
      bias: this.bias,
    });
  }

  public getWeights(): Record<string, number> {
    return this.weights;
  }

  public getBias(): number {
    return this.bias;
  }
}
