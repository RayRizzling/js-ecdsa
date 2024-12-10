# ECDSA with Deterministic Key Generation

This example implementation demonstrates the Elliptic Curve Digital Signature Algorithm (ECDSA) with deterministic key generation using the P-256 curve (secp256r1 or prime256v1). It allows you to generate a public/private key pair from a provided seed and salt, sign messages, and verify signatures using elliptic curve mathematics. **This is a simplified example for educational purposes and should not be used in production environments.**


## Security Considerations

1. **Deterministic Private Key Generation**:  
   The private key is derived using a combination of a user-provided **seed** and **salt** through the `SHA-256` algorithm. It’s crucial that the seed and salt provide sufficient entropy to avoid predictable key generation. **Weak or low-entropy seeds/salts can result in insecure keys**, and it's recommended to use cryptographically secure random sources.

2. **Private Key Protection**:  
   The private key is never transmitted over the network in this example; it is generated and used solely within the browser. **Ensure that the private key is stored securely** when building real-world applications. The current implementation stores the private key only temporarily in memory.

3. **Random Number Generation for Signature (k)**:  
   The `k` value used for signing is randomly generated for each message and constrained within the valid range `[1, n-1]`. **In real-world use, make sure the random number generator is cryptographically secure**, such as `crypto.getRandomValues` in browsers.

4. **Curve Point Validation**:  
   After generating the public key from the private key, a validation check is performed to ensure that the point lies on the elliptic curve. This prevents invalid keys from being used in the signing process. **Always validate the public key** to prevent the use of invalid or compromised keys.

5. **Signature Security**:  
   When signing messages, ensure that **the same `k` value is never reused for different messages**. Reusing `k` can lead to key leakage and is a known vulnerability in ECDSA. The current implementation ensures that `k` is always freshly generated for each signature.

6. **Constant-Time Comparison for Signature Verification**:  
   The signature verification process uses **constant-time comparison** to prevent timing attacks. This ensures that the time it takes to compare two values does not reveal information about their relationship, which could potentially leak details about the private key.

7. **Input Validation**:  
   It's crucial to **validate user inputs** for both the seed/salt and message to ensure that they are in the correct format. This implementation does basic checks, but it may need more rigorous validation for production environments.

8. **Secure Cryptographic Operations**:  
   The elliptic curve operations such as point addition and scalar multiplication are performed manually using modular arithmetic and the extended Euclidean algorithm for modular inversion. **While this implementation provides transparency, it is recommended to use well-established cryptographic libraries** like `crypto.subtle` or `elliptic` in production environments to avoid potential performance bottlenecks and security risks from custom code.


## Performance Considerations

1. **Efficiency of Point Multiplication**:  
   Scalar multiplication (`pointMult`) is performed using the binary method, which is efficient but may not be the fastest for large-scale applications. Consider optimizations if performance is critical.

2. **SHA-256 Hashing**:  
   The SHA-256 hashing function is used for both private key generation and message signing. While generally fast and secure, **hashing large messages repeatedly in a browser environment** may impact performance. Offload intensive computations to a backend server or use Web Workers to improve user experience for larger messages.

3. **Memory Usage**:  
   The implementation keeps the private key in memory and performs cryptographic operations directly on user input. Be cautious about handling large numbers of key generation or signature operations simultaneously, as they may lead to performance degradation in some browsers.


## Browser Compatibility

1. **Private Key Handling**:  
   This implementation uses the **Web Cryptography API** (`crypto.subtle`), which is supported by all modern browsers (including Chrome, Firefox, Edge, and Safari). This ensures that private key operations, such as signing and verification, can be securely performed across browsers without relying on browser-specific implementations. **No special dependencies on specific key formats like PKCS#8** are required. The private key is derived and managed using the Web Cryptography API, which is broadly available in the majority of current browsers.

2. **Elliptic Curve Operations**:  
   The elliptic curve operations, including point addition and scalar multiplication, are implemented directly using JavaScript and the Web Cryptography API. This ensures compatibility across modern browsers. If you're targeting older browsers that do not support `crypto.subtle`, you may need to include polyfills or use other alternatives.


## Limitations

1. **Browser Limitations**:  
   The implementation assumes that the browser has support for modern Web Cryptography APIs (e.g., `crypto.subtle.digest` and `crypto.getRandomValues`). If these are not supported in older browsers, you may need to include polyfills or fallbacks.

2. **No Secure Storage**:  
   In this implementation, the private key is temporarily stored in the DOM (browser memory). **For real-world use, consider secure storage mechanisms** such as `Web Crypto API` (if supported) or external secure storage solutions.

3. **No Key Backup**:  
   The private key and salt are only generated during the session. **Ensure the private key is backed up securely** (e.g., using a secure cloud service or hardware wallet) before it is lost.

4. **No Revocation Mechanism**:  
   This example does not include a way to revoke or rotate keys. **In production environments**, ensure that users can safely revoke or regenerate keys when necessary.


## How to Use

1. **Generate Keys**:  
   - Enter a **seed** and **salt** in the input fields and click **Generate Keys**. This will produce a private and public key pair.
   
2. **Sign Messages**:  
   - Enter a **message** to sign and click **Sign**. The signature for the message will be displayed.

3. **Verify Signatures**:  
   - The generated signature can be verified using the public key and the message. The verification result will be displayed, with a background color indicating whether the signature is valid (green) or invalid (red).


## Example of Output

Private Key: in Hex

Public Key: { "x": "Public Key X in Hex", "y": "Public Key Y in Hex" }

Signature: { "r": "Signature R in Hex", "s": "Signature S in Hex" }


## Credits

This implementation is based on standard elliptic curve cryptography principles, including the P-256 curve (secp256r1). The elliptic curve operations, including point addition and scalar multiplication, are manually implemented for educational purposes.

For real-world applications, it is recommended to use established cryptographic libraries for elliptic curve operations and key management.


## License

This implementation is licensed under the MIT License. See LICENSE for more details.


