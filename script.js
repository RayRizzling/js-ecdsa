// Constants for the P-256 curve (secp256r1 or prime256v1)
const n = BigInt("0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551"); // Curve order (n)
const P = BigInt("0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff"); // Prime field modulus (P)
const A = BigInt("0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc"); // Curve coefficient A
const B = BigInt("0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b"); // Curve coefficient B
const G = { 
    x: BigInt("0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296"), // Generator point X-coordinate (G)
    y: BigInt("0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5")  // Generator point Y-coordinate (G)
};

// Generate deterministic private key from the seed and salt using SHA-256
async function generateKeys() {
    const seed = document.getElementById('seed').value;
    const salt = document.getElementById('salt').value;

    if (!seed || !salt) {
        alert("Please enter both seed and salt!");
        return;
    }

    const enc = new TextEncoder();
    let privateKey = BigInt(0);
    do {
        // Derive the private key using SHA-256 with the seed and salt
        const derivedBits = await crypto.subtle.digest("SHA-256", enc.encode(seed + salt));
        privateKey = BigInt("0x" + Array.from(new Uint8Array(derivedBits))
            .map(b => b.toString(16).padStart(2, "0")).join("")) % n; // Ensure private key is within range [0, n-1]
    } while (privateKey <= 0n || privateKey >= n); // Keep trying until a valid private key is generated

    const publicKey = pointMult(privateKey, G); // Generate the corresponding public key using scalar multiplication
    if (!publicKey || !validatePoint(publicKey)) {
        alert("Invalid public key generated!");
        return;
    }

    document.getElementById('output').innerHTML = `
        <h3>Private Key:</h3>
        <pre id="privateKey">${privateKey.toString(16)}</pre>
        <h3>Public Key:</h3>
        <pre id="publicKey">${JSON.stringify({ x: publicKey.x.toString(16), y: publicKey.y.toString(16) }, null, 2)}</pre>
    `;
}

function constantTimeCompare(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i]; // XOR operation: If any bit differs, the result will be non-zero
    }
    return result === 0;
}

// Validate a point on the elliptic curve (check if it satisfies the curve equation)
function validatePoint(point) {
    if (point === null) return true;
    const { x, y } = point;
    const lhs = mod(y ** 2n, P); // Left-hand side of the curve equation: y^2 mod p
    const rhs = mod(x ** 3n + A * x + B, P); // Right-hand side of the curve equation: x^3 + A * x + B mod p
    return lhs === rhs;
}

// Generate a random k for the signature process
function generateRandomK() {
    const array = new Uint8Array(32); // 32 bytes = 256 bits
    crypto.getRandomValues(array); // Generate random bytes
    let k = BigInt("0x" + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join(''));
    return k % n; // Ensure k is within the valid range [1, n-1]
}

// Sign a message using the private key
async function signMessage() {
    const message = document.getElementById('message').value;
    const privateKeyHex = document.getElementById('privateKey').textContent;

    if (!privateKeyHex) {
        alert("Please generate a key pair first!");
        return;
    }
    if (!message) {
        alert("Please enter a message!");
        return;
    }

    const prevSignatureEntry = document.getElementById('signature-container');
    if (prevSignatureEntry) {
        prevSignatureEntry.remove();
    }

    console.time("signMessage");
    const privateKey = BigInt("0x" + privateKeyHex); // Convert the private key from hex to BigInt

    // Hash the message using SHA-256
    const messageHashArrayBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
    const messageHashArray = new Uint8Array(messageHashArrayBuffer);
    const messageHash = BigInt("0x" + Array.from(messageHashArray)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(''));

    // Compute the signature
    let k = generateRandomK(); // Generate a random k for signing
    const rPoint = pointMult(k, G); // Compute the elliptic curve point k*G
    const r = rPoint.x % n; // r is the x-coordinate of the point mod n

    const s = mod(((messageHash + r * privateKey) * modInv(k, n)) % n, n); // Compute the signature parameter s
    k = null;
    console.timeEnd("signMessage");

    const signature = JSON.stringify({ r: r.toString(16), s: s.toString(16) });

    document.getElementById('output').innerHTML += `
        <div id="signature-container">
            <h3>Signature:</h3>
            <pre id="signature">${signature}</pre>
        </div>
    `;

    const isValid = await verifySignature();
    const signatureContainer = document.getElementById('signature-container');

    // Change the background color based on the validity of the signature
    if (isValid) {
        signatureContainer.style.backgroundColor = 'green';
    } else {
        signatureContainer.style.backgroundColor = 'red';
    }

}

// Verify the signature using the public key
async function verifySignature() {
    const message = document.getElementById('message').value;
    const signatureText = document.getElementById('signature').textContent;

    if (!signatureText) {
        alert("No signature found!");
        return false;
    }

    // Retrieve the public key
    const publicKeyElement = document.getElementById('publicKey');
    if (!publicKeyElement) {
        alert("Public key has not been generated yet.");
        return false;
    }

    const publicKeyJSON = JSON.parse(publicKeyElement.textContent);

    console.time("verifySignature");
    const publicKey = {
        x: BigInt("0x" + publicKeyJSON.x),
        y: BigInt("0x" + publicKeyJSON.y)
    };

    const signature = JSON.parse(signatureText);
    const r = BigInt("0x" + signature.r);
    const s = BigInt("0x" + signature.s);

    // Check if r and s are within the valid range
    if (r <= 0n || r >= n || s <= 0n || s >= n) {
        alert("Invalid signature values");
        return false;
    }

    // 1. Compute the hash of the message
    const msgHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
    const msgHashBigInt = BigInt("0x" + Array.from(new Uint8Array(msgHash)).map(b => b.toString(16).padStart(2, "0")).join(""));

    // 2. Calculate w = s^(-1) mod n
    const w = modInv(s, n);

    // 3. Calculate u1 = H(m) * w mod n and u2 = r * w mod n
    const u1 = (msgHashBigInt * w) % n;
    const u2 = (r * w) % n;

    // 4. Calculate the point P = u1 * G + u2 * Q
    const pointP = pointAdd(pointMult(u1, G), pointMult(u2, publicKey));

    // 5. Check if r == xP mod n using constant-time comparison
    const xP = pointP.x % n;
    const rHex = r.toString(16).padStart(64, '0'); // Ensure r is in a consistent format (hex)
    console.timeEnd("verifySignature");

    // Compare xP and r in constant time
    if (constantTimeCompare(rHex, xP.toString(16).padStart(64, '0'))) {
        console.log("Signature is valid.");
        return true;
    } else {
        console.log("Signature is invalid.");
        return false;
    }
}