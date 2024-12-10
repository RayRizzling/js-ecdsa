// Modular arithmetic functions for the elliptic curve operations

// Modulo operation to handle negative results correctly
function mod(a, m) {
    return ((a % m) + m) % m;
}

// Subtraction in modular space
function modSub(a, b, m) {
    return mod(a - b, m);
}

// Multiplication in modular space
function modMult(a, b, p) {
    return mod(a * b, p);
}

// Modular inverse using the Extended Euclidean Algorithm
function modInv(a, p) {
    if (a === 0n) throw new Error("Modular inverse is not defined for 0");

    let t = 0n, newT = 1n;
    let r = p, newR = a % p;

    // Extended Euclidean Algorithm to find the inverse of 'a' modulo 'p'
    while (newR !== 0n) {
        const quotient = r / newR;
        [t, newT] = [newT, t - quotient * newT];
        [r, newR] = [newR, r - quotient * newR];
    }

    // If the greatest common divisor is greater than 1, no modular inverse exists
    if (r > 1n) throw new Error("Element not invertible");

    // Ensure the result is positive
    if (t < 0n) t += p;

    return t;
}

// Elliptic curve point addition (Weierstrass equation)
function pointAdd(p1, p2) {
    if (p1 === null) return p2; // If p1 is the identity (point at infinity), return p2
    if (p2 === null) return p1; // If p2 is the identity, return p1
    if (p1.x === p2.x && mod(p1.y + p2.y, P) === 0n) return null; // If p1 and p2 are inverses, return the identity

    let lambda;
    if (p1.x === p2.x && p1.y === p2.y) {
        // Point doubling
        const num = 3n * mod(p1.x ** 2n, P) + A; // Formula for point doubling: λ = (3 * x1^2 + A) / 2y1
        const denom = modInv(2n * p1.y, P); // Denominator is the modular inverse of 2y1
        lambda = modMult(num, denom, P);
    } else {
        // Regular point addition
        const num = modSub(p2.y, p1.y, P); // y2 - y1
        const denom = modInv(modSub(p2.x, p1.x, P), P); // x2 - x1
        lambda = modMult(num, denom, P); // λ = (y2 - y1) / (x2 - x1)
    }

    // Calculate the new point coordinates
    const x3 = mod(lambda ** 2n - p1.x - p2.x, P); // x3 = λ^2 - x1 - x2
    const y3 = mod(lambda * modSub(p1.x, x3, P) - p1.y, P); // y3 = λ(x1 - x3) - y1
    return { x: x3, y: y3 };
}

// Elliptic curve point multiplication (scalar multiplication)
function pointMult(k, point) {
    let result = null;
    let addend = point;

    // Perform the binary method for scalar multiplication
    while (k > 0n) {
        if (k & 1n) {
            result = pointAdd(result, addend); // Add the point to the result if the corresponding bit is 1
        }
        addend = pointAdd(addend, addend); // Double the point (equivalent to shift left in binary)
        k >>= 1n; // Right shift to process the next bit of k
    }
    
    return result;
}