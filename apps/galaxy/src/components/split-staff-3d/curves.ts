import * as THREE from "three";

/**
 * THREE.Curve's constructor is protected in its type declarations (must
 * subclass), even though the prototype freely does `new THREE.Curve()` and
 * overrides `getPoint` at runtime. This is the one subclass every
 * function-defined curve in this module routes through.
 */
export class FnCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private readonly fn: (t: number) => THREE.Vector3) {
    super();
  }

  getPoint(t: number): THREE.Vector3 {
    return this.fn(t);
  }
}
