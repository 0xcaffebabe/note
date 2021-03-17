# socket

## 整体结构

```java
// 这些布尔值属性维护了socket的状态
private boolean created = false;
private boolean bound = false;
private boolean connected = false;
private boolean closed = false;
private Object closeLock = new Object();
private boolean shutIn = false;
private boolean shutOut = false;
```

## 创建

```java
private Socket(SocketAddress address, SocketAddress localAddr,
               boolean stream) throws IOException {
    setImpl();
    // backward compatibility
    if (address == null)
        throw new NullPointerException();
    try {
        createImpl(stream);
        if (localAddr != null)
            bind(localAddr);
        connect(address);
    } catch (IOException | IllegalArgumentException | SecurityException e) {
        try {
            close();
        } catch (IOException ce) {
            e.addSuppressed(ce);
        }
        throw e;
    }
}
```