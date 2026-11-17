# NOTWEB

### Beyond Websites. Beyond Limits.

**One website. Multiple platforms. Unlimited possibilities.**

NOTWEB is an open-source platform designed to transform websites into responsive experiences and cross-platform applications through intelligent analysis, automated optimization, and AI-assisted development.

The long-term vision is to bring website analysis, responsive adaptation, Progressive Web App (PWA) generation, application wrapping, device previews, and AI-powered reconstruction together in one developer-friendly platform.

> **Project status:** Early development. Features described in the roadmap are planned and may not be implemented yet.

---

## The Vision

Building for multiple platforms often means managing separate tools, configurations, and workflows.

NOTWEB aims to simplify that process by bringing these capabilities into a unified workspace.

- **Analyze** — Understand a website's structure and behavior.
- **Adapt** — Identify and improve responsive layouts.
- **Preview** — Test experiences across different screen sizes.
- **Generate** — Prepare Progressive Web App configurations.
- **Wrap** — Explore packaging web experiences for supported platforms.
- **Reconstruct** — Use AI-assisted workflows to help developers improve or rebuild interfaces.

Our goal is to make the journey from website to multi-platform experience more accessible.

---

## Planned Features

| Feature | Description | Status |
|---|---|---|
| Website Analyzer | Inspect website structure and resources | Planned |
| Responsive Engine | Help identify layout and viewport issues | Planned |
| Device Preview | Preview layouts across device sizes | Planned |
| AI Engine | Support AI-assisted analysis and reconstruction | Planned |
| PWA Generator | Generate PWA-related files and configurations | Planned |
| Wrapper Engine | Prepare web experiences for application wrappers | Planned |
| Application Packager | Support packaging workflows for compatible platforms | Planned |
| Browser Extension | Provide browser-based access to NOTWEB tools | Planned |
| NOTWEB Studio | Offer a unified workspace for projects | Planned |
| Local-First Workflows | Prioritize local processing where practical | Planned |

Features will be marked as implemented only after they are working and tested.

---

## Architecture

NOTWEB is organized as a modular monorepo.

```text
notweb/
├── apps/
│   ├── studio/       # Main development workspace
│   ├── extension/    # Browser extension
│   ├── api/          # Optional API services
│   └── desktop/      # Desktop application
│
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── shared/              # Shared utilities and types
│   ├── website-analyzer/    # Website analysis
│   ├── responsive-engine/   # Responsive layout tools
│   ├── ai-engine/           # AI integration and orchestration
│   ├── device-preview/      # Device preview utilities
│   ├── wrapper-engine/      # Web application wrapping
│   ├── pwa-generator/       # PWA generation
│   └── app-packager/        # Application packaging
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   ├── architecture/
│   ├── guides/
│   └── api/
│
├── scripts/
└── .github/
    └── workflows/
```

The architecture is intended to keep features modular, reusable, and independently testable.

---

## Technology Direction

The project is being developed with a modern TypeScript-oriented toolchain.

| Technology | Intended role |
|---|---|
| TypeScript | Type-safe application and package development |
| React | Interactive user interfaces |
| Node.js | Development tooling and backend services |
| pnpm | Package management and workspace dependencies |
| Turborepo | Monorepo task orchestration |
| ESLint | Code quality checks |
| Prettier | Consistent code formatting |
| Playwright | End-to-end testing |
| Local AI models | Optional AI-assisted workflows |

The exact stack may evolve as implementation and testing progress.

---

## Design Principles

### 1. Modular by Design
Features should be separated into reusable packages with clear responsibilities.

### 2. Local-First Where Practical
Prefer local processing when feasible. External AI services should be optional rather than a mandatory requirement for every workflow.

### 3. Developer-Friendly
Provide clear interfaces, predictable configuration, useful errors, and documented workflows.

### 4. Responsive by Default
Treat mobile, tablet, and desktop experiences as first-class targets.

### 5. Privacy-Conscious
Make data flows understandable and avoid transmitting website content to external services without an explicit, documented reason.

### 6. Open Source
Encourage community contributions, transparent development, and reproducible workflows.

---

## Getting Started

### Prerequisites

Install the following tools:

- Node.js 22 or a compatible supported version
- pnpm 10 or a compatible supported version
- Git

Check your installed versions:

```bash
node --version
pnpm --version
git --version
```

### Installation

Clone the repository:

```bash
git clone https://github.com/not-brajesh/notweb.git
cd notweb
```

Install workspace dependencies:

```bash
pnpm install
```

**Development note:** The repository is under active development. Installation alone does not guarantee that every application can run yet. Individual apps and packages need their respective configuration and scripts implemented.

---

## Development Commands

The root project is designed to support these commands as the relevant package scripts are implemented.

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm format
pnpm format:check
```

Some commands may remain unavailable until their dependencies and package-level scripts have been configured.

---

## Roadmap

### Stage 1 — Foundation
- [x] Establish the repository structure
- [x] Configure the pnpm workspace
- [x] Configure Turborepo
- [x] Establish TypeScript base settings
- [x] Establish formatting and linting configuration
- [ ] Complete dependency and script configuration
- [ ] Add continuous integration checks

### Stage 2 — Core Engine
- [ ] Define shared types and interfaces
- [ ] Implement website analysis
- [ ] Build responsive layout diagnostics
- [ ] Add device preview utilities
- [ ] Create automated tests

### Stage 3 — NOTWEB Studio
- [ ] Build the main interface
- [ ] Add project creation and management
- [ ] Integrate analysis results
- [ ] Add responsive preview workflows

### Stage 4 — AI and Generation
- [ ] Implement an AI provider abstraction
- [ ] Explore local-model integrations
- [ ] Generate PWA assets and configurations
- [ ] Add AI-assisted reconstruction workflows

### Stage 5 — Cross-Platform Workflows
- [ ] Develop the browser extension
- [ ] Build application wrapper workflows
- [ ] Explore desktop packaging
- [ ] Document platform-specific limitations

### Stage 6 — Reliability and Release
- [ ] Add unit and integration tests
- [ ] Add end-to-end tests
- [ ] Configure CI
- [ ] Publish developer documentation
- [ ] Prepare an initial public release

---

## Contributing

Contributions, bug reports, feature proposals, and documentation improvements are welcome.

Before contributing:

1. Read [CONTRIBUTING.md](CONTRIBUTING.md).
2. Review the project's current issues and roadmap.
3. Keep changes focused and testable.
4. Document new behavior and configuration.
5. Avoid committing credentials, API keys, or private website data.

For security-sensitive reports, follow [SECURITY.md](SECURITY.md).

---

## Security and Privacy

NOTWEB may eventually inspect website content, source code, and external resources.

Security-sensitive features must account for:

- Untrusted website content
- Malicious URLs and redirects
- Secret and credential exposure
- Safe handling of downloaded resources
- Permission boundaries for browser extensions
- Explicit consent for external AI processing

See [SECURITY.md](SECURITY.md) for reporting guidance.

---

## License

NOTWEB is distributed under the [MIT License](LICENSE).

---

## Project Philosophy

We believe developers should not need a completely different workflow for every platform.

NOTWEB aims to make website analysis, responsive optimization, and multi-platform development feel like parts of one connected process.

**Build once. Adapt intelligently. Reach more platforms.**

**NOTWEB — Beyond Websites. Beyond Limits.**





# Data Structure Laboratory (E0054B)

## Experiment 0

**Question:**
Write a C++ program demonstrating basic syntax and object-oriented concepts (classes and objects).

**Execution Code:**
```cpp
#include <iostream>
using namespace std;

class Student {
private:
    int rollNo;
public:
    void setRoll(int r) { rollNo = r; }
    void showRoll() { cout << rollNo; }
};

int main() {
    Student s1; // Object creation
    s1.setRoll(101);
    s1.showRoll();
    return 0;
}
```

**Input:**
```text
No input required
```

**Output:**
```text
101
```

---

## Experiment 1(a)

**Question:**
Write a C++ program that prints numbers from 1 to N and analyze its time complexity and space complexity using asymptotic notations.

**Execution Code:**
```cpp
#include <iostream>
using namespace std;

int main() {
    int n;
    cout << "Enter the value of N: ";
    cin >> n;

    cout << "Numbers from 1 to " << n << " are:" << endl;
    for (int i = 1; i <= n; i++) {
        cout << i << " ";
    }
    cout << endl;

    return 0;
}
```

**Input:**
```text
5
```

**Output:**
```text
Enter the value of N: 5
Numbers from 1 to 5 are:
1 2 3 4 5 
```

---

## Experiment 1(b)

**Question:**
Write a C++ program to implement basic operations on two-dimensional arrays (creation, traversal, insertion, updation, and transpose) and to perform address calculation of array elements using row-major and column-major order formulas.

**Execution Code:**
```cpp
#include <iostream>
using namespace std;

const int M = 3; // Number of rows
const int N = 3; // Number of columns

// Function to create/input the 2-D array
void createArray(int A[M][N]) {
    cout << "Enter " << M * N << " elements (row-wise):" << endl;
    for (int i = 0; i < M; i++)
        for (int j = 0; j < N; j++)
            cin >> A[i][j];
}

// Function to traverse/display the 2-D array
void displayArray(int A[M][N]) {
    cout << "Matrix elements are:" << endl;
    for (int i = 0; i < M; i++) {
        for (int j = 0; j < N; j++)
            cout << A[i][j] << "\t";
        cout << endl;
    }
}

// Function to update an element
void updateElement(int A[M][N], int i, int j, int value) {
    if (i >= 0 && i < M && j >= 0 && j < N)
        A[i][j] = value;
    else
        cout << "Invalid index!" << endl;
}

// Function to compute transpose of the matrix
void transposeArray(int A[M][N], int T[N][M]) {
    for (int i = 0; i < M; i++)
        for (int j = 0; j < N; j++)
            T[j][i] = A[i][j];
}

// Function to calculate address of element A[i][j] (Row-Major Order)
int calculateAddress(int base, int W, int i, int j, int N) {
    return base + W * (i * N + j);
}

int main() {
    int A[M][N], T[N][M];
    int base, W, row, col;

    createArray(A);
    displayArray(A);

    // Update an element
    cout << "\nEnter row, column, and new value to update: ";
    int ur, uc, uv;
    cin >> ur >> uc >> uv;
    updateElement(A, ur, uc, uv);
    cout << "Matrix after updation:" << endl;
    displayArray(A);

    // Transpose
    transposeArray(A, T);
    cout << "\nTranspose of the matrix:" << endl;
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < M; j++)
            cout << T[i][j] << "\t";
        cout << endl;
    }

    // Address calculation
    cout << "\nEnter Base Address, Element Size (W), row (i), column (j): ";
    cin >> base >> W >> row >> col;
    int addr = calculateAddress(base, W, row, col, N);
    cout << "Address of A[" << row << "][" << col << "] = " << addr << endl;

    return 0;
}
```

**Input:**
```text
1 2 3
4 5 6
7 8 9
1 1 50
1000 2 1 2
```

**Output:**
```text
Enter 9 elements (row-wise):
1 2 3
4 5 6
7 8 9
Matrix elements are:
1	2	3	
4	5	6	
7	8	9	

Enter row, column, and new value to update: 1 1 50
Matrix after updation:
Matrix elements are:
1	2	3	
4	50	6	
7	8	9	

Transpose of the matrix:
1	4	7	
2	50	8	
3	6	9	

Enter Base Address, Element Size (W), row (i), column (j): 1000 2 1 2
Address of A[1][2] = 1010
```

---

## Experiment 2

**Question:**
Write a C++ program to represent a sparse matrix using the triplet (3-tuple) representation and to perform the transpose operation on the sparse matrix.

**Execution Code:**
```cpp
#include <iostream>
using namespace std;

const int MAX = 50;

// Function to create the sparse matrix (triplet form) from a 2-D array
int createSparse(int A[][MAX], int m, int n, int sparse[][3]) {
    int t = 1;
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            if (A[i][j] != 0) {
                sparse[t][0] = i;
                sparse[t][1] = j;
                sparse[t][2] = A[i][j];
                t++;
            }
    sparse[0][0] = m;
    sparse[0][1] = n;
    sparse[0][2] = t - 1;
    return t - 1;
}

// Function to display the triplet table
void displaySparse(int sparse[][3], int t) {
    cout << "Row\tCol\tValue" << endl;
    for (int i = 0; i <= t; i++)
        cout << sparse[i][0] << "\t" << sparse[i][1] << "\t" << sparse[i][2] << endl;
}

// Fast Transpose function
void fastTranspose(int sparse[][3], int result[][3]) {
    int m = sparse[0][0], n = sparse[0][1], t = sparse[0][2];
    result[0][0] = n;
    result[0][1] = m;
    result[0][2] = t;

    if (t > 0) {
        int count[MAX] = {0}, position[MAX] = {0};
        for (int i = 1; i <= t; i++)
            count[sparse[i][1]]++;

        position[0] = 1;
        for (int i = 1; i < n; i++)
            position[i] = position[i - 1] + count[i - 1];

        for (int i = 1; i <= t; i++) {
            int col = sparse[i][1];
            int p = position[col];
            result[p][0] = sparse[i][1];
            result[p][1] = sparse[i][0];
            result[p][2] = sparse[i][2];
            position[col]++;
        }
    }
}

int main() {
    int m, n;
    int A[MAX][MAX];

    cout << "Enter number of rows and columns: ";
    cin >> m >> n;

    cout << "Enter matrix elements row-wise:" << endl;
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            cin >> A[i][j];

    int sparse[MAX][3], result[MAX][3];
    int t = createSparse(A, m, n, sparse);

    cout << "\nTriplet Representation of Sparse Matrix:" << endl;
    displaySparse(sparse, t);

    fastTranspose(sparse, result);
    cout << "\nTriplet Representation after Fast Transpose:" << endl;
    displaySparse(result, t);

    return 0;
}
```

**Input:**
```text
4 4
0 0 3 0
0 0 0 0
0 -1 0 0
4 0 0 0
```

**Output:**
```text
Enter number of rows and columns: 4 4
Enter matrix elements row-wise:
0 0 3 0
0 0 0 0
0 -1 0 0
4 0 0 0

Triplet Representation of Sparse Matrix:
Row	Col	Value
4	4	3
0	2	3
2	1	-1
3	0	4

Triplet Representation after Fast Transpose:
Row	Col	Value
4	4	3
0	3	4
1	2	-1
2	0	3
```

---

## Experiment 3(a)

**Question:**
Write a C++ program to implement the Stack Abstract Data Type (ADT) using both array and linked list representations, and to perform basic stack operations such as push, pop, peek, and display.

**Execution Code:**
```cpp
#include <iostream>
using namespace std;

class ArrayStack {
    int arr[100], top;
public:
    ArrayStack() { top = -1; }

    void push(int x) {
        if (top == 99) { cout << "Stack Overflow\n"; return; }
        arr[++top] = x;
    }

    void pop() {
        if (top == -1) { cout << "Stack Underflow\n"; return; }
        cout << "Popped: " << arr[top--] << endl;
    }

    void peek() {
        if (top == -1) { cout << "Stack is Empty\n"; return; }
        cout << "Top Element: " << arr[top] << endl;
    }

    bool isEmpty() { return top == -1; }

    void display() {
        if (top == -1) { cout << "Stack is Empty\n"; return; }
        cout << "Stack (top to bottom): ";
        for (int i = top; i >= 0; i--)
            cout << arr[i] << " ";
        cout << endl;
    }
};

struct Node {
    int data;
    Node* next;
};

class LinkedStack {
    Node* top;
public:
    LinkedStack() { top = NULL; }

    void push(int x) {
        Node* newNode = new Node();
        newNode->data = x;
        newNode->next = top;
        top = newNode;
    }

    void pop() {
        if (top == NULL) { cout << "Stack Underflow\n"; return; }
        Node* temp = top;
        cout << "Popped: " << temp->data << endl;
        top = top->next;
        delete temp;
    }

    void peek() {
        if (top == NULL) { cout << "Stack is Empty\n"; return; }
        cout << "Top Element: " << top->data << endl;
    }

    bool isEmpty() { return top == NULL; }

    void display() {
        if (top == NULL) { cout << "Stack is Empty\n"; return; }
        cout << "Stack (top to bottom): ";
        Node* temp = top;
        while (temp != NULL) {
            cout << temp->data << " ";
            temp = temp->next;
        }
        cout << endl;
    }
};

int main() {
    ArrayStack aStack;
    LinkedStack lStack;
    int choice, value;

    do {
        cout << "\n1.Push (Array) 2.Pop (Array) 3.Display (Array) "
             << "4.Push (Linked) 5.Pop (Linked) 6.Display (Linked) 0.Exit\nChoice: ";
        cin >> choice;
        switch (choice) {
            case 1: cout << "Enter value: "; cin >> value; aStack.push(value); break;
            case 2: aStack.pop(); break;
            case 3: aStack.display(); break;
            case 4: cout << "Enter value: "; cin >> value; lStack.push(value); break;
            case 5: lStack.pop(); break;
            case 6: lStack.display(); break;
        }
    } while (choice != 0);

    return 0;
}
```

**Input:**
```text
1
10
1
20
3
2
3
4
30
4
40
6
5
6
0
```

**Output:**
```text
1.Push (Array) 2.Pop (Array) 3.Display (Array) 4.Push (Linked) 5.Pop (Linked) 6.Display (Linked) 0.Exit
Choice: 1
Enter value: 10

1.Push (Array) 2.Pop (Array) 3.Display (Array) 4.Push (Linked) 5.Pop (Linked) 6.Display (Linked) 0.Exit
Choice: 1
Enter value: 20

1.Push (Array) 2.Pop (Array) 3.Display (Array) 4.Push (Linked) 5.Pop (Linked) 6.Display (Linked) 0.Exit
Choice: 3
Stack (top to bottom): 20 10 

1.Push (Array) 2.Pop (Array) 3.Display (Array) 4.Push (Linked) 5.Pop (Linked) 6.Display (Linked) 0.Exit
Choice: 2
Popped: 20

1.Push (Array) 2.Pop (Array) 3.Display (Array) 4.Push (Linked) 5.Pop (Linked) 6.Display (Linked) 0.Exit
Choice: 3
Stack (top to bottom): 10 

1.Push (Array) 2.Pop (Array) 3.Display (Array) 4.Push (Linked) 5.Pop (Linked) 6.Display (Linked) 0.Exit
Choice: 4
Enter value: 30

1.Push (Array) 2.Pop (Array) 3.Display (Array) 4.Push (Linked) 5.Pop (Linked) 6.Display (Linked) 0.Exit
Choice: 4
Enter value: 40

1.Push (Array) 2.Pop (Array) 3.Display (Array) 4.Push (Linked) 5.Pop (Linked) 6.Display (Linked) 0.Exit
Choice: 6
Stack (top to bottom): 40 30 

1.Push (Array) 2.Pop (Array) 3.Display (Array) 4.Push (Linked) 5.Pop (Linked) 6.Display (Linked) 0.Exit
Choice: 5
Popped: 40

1.Push (Array) 2.Pop (Array) 3.Display (Array) 4.Push (Linked) 5.Pop (Linked) 6.Display (Linked) 0.Exit
Choice: 6
Stack (top to bottom): 30 

1.Push (Array) 2.Pop (Array) 3.Display (Array) 4.Push (Linked) 5.Pop (Linked) 6.Display (Linked) 0.Exit
Choice: 0
```

---

## Experiment 3(b)

**Question:**
Write a C++ program to implement two stacks using a single array and to perform basic stack operations — push, pop, and peek — on both stacks independently and efficiently.

**Execution Code:**
```cpp
#include <iostream>
using namespace std;

class TwoStacks {
    int *arr, size, top1, top2;
public:
    TwoStacks(int n) {
        size = n;
        arr = new int[n];
        top1 = -1;   // Stack 1 grows from left (index 0 upward)
        top2 = n;    // Stack 2 grows from right (index n-1 downward)
    }

    void push1(int x) {
        if (top1 + 1 == top2) { cout << "Stack Overflow (combined)\n"; return; }
        arr[++top1] = x;
    }

    void push2(int x) {
        if (top2 - 1 == top1) { cout << "Stack Overflow (combined)\n"; return; }
        arr[--top2] = x;
    }

    void pop1() {
        if (top1 == -1) { cout << "Stack 1 Underflow\n"; return; }
        cout << "Popped from Stack 1: " << arr[top1--] << endl;
    }

    void pop2() {
        if (top2 == size) { cout << "Stack 2 Underflow\n"; return; }
        cout << "Popped from Stack 2: " << arr[top2++] << endl;
    }

    void peek1() {
        if (top1 == -1) { cout << "Stack 1 is Empty\n"; return; }
        cout << "Stack 1 Top: " << arr[top1] << endl;
    }

    void peek2() {
        if (top2 == size) { cout << "Stack 2 is Empty\n"; return; }
        cout << "Stack 2 Top: " << arr[top2] << endl;
    }

    void display() {
        cout << "Stack 1 (bottom to top): ";
        for (int i = 0; i <= top1; i++) cout << arr[i] << " ";
        cout << "\nStack 2 (bottom to top): ";
        for (int i = size - 1; i >= top2; i--) cout << arr[i] << " ";
        cout << endl;
    }

    ~TwoStacks() { delete[] arr; }
};

int main() {
    int n, choice, value;
    cout << "Enter size of shared array: ";
    cin >> n;
    TwoStacks ts(n);

    do {
        cout << "\n1.Push-S1 2.Pop-S1 3.Peek-S1 4.Push-S2 5.Pop-S2 6.Peek-S2 "
             << "7.Display 0.Exit\nChoice: ";
        cin >> choice;
        switch (choice) {
            case 1: cout << "Enter value: "; cin >> value; ts.push1(value); break;
            case 2: ts.pop1(); break;
            case 3: ts.peek1(); break;
            case 4: cout << "Enter value: "; cin >> value; ts.push2(value); break;
            case 5: ts.pop2(); break;
            case 6: ts.peek2(); break;
            case 7: ts.display(); break;
        }
    } while (choice != 0);

    return 0;
}
```

**Input:**
```text
5
1
10
1
20
4
50
4
40
7
3
6
2
5
7
0
```

**Output:**
```text
Enter size of shared array: 5

1.Push-S1 2.Pop-S1 3.Peek-S1 4.Push-S2 5.Pop-S2 6.Peek-S2 7.Display 0.Exit
Choice: 1
Enter value: 10

1.Push-S1 2.Pop-S1 3.Peek-S1 4.Push-S2 5.Pop-S2 6.Peek-S2 7.Display 0.Exit
Choice: 1
Enter value: 20

1.Push-S1 2.Pop-S1 3.Peek-S1 4.Push-S2 5.Pop-S2 6.Peek-S2 7.Display 0.Exit
Choice: 4
Enter value: 50

1.Push-S1 2.Pop-S1 3.Peek-S1 4.Push-S2 5.Pop-S2 6.Peek-S2 7.Display 0.Exit
Choice: 4
Enter value: 40

1.Push-S1 2.Pop-S1 3.Peek-S1 4.Push-S2 5.Pop-S2 6.Peek-S2 7.Display 0.Exit
Choice: 7
Stack 1 (bottom to top): 10 20 
Stack 2 (bottom to top): 50 40 

1.Push-S1 2.Pop-S1 3.Peek-S1 4.Push-S2 5.Pop-S2 6.Peek-S2 7.Display 0.Exit
Choice: 3
Stack 1 Top: 20

1.Push-S1 2.Pop-S1 3.Peek-S1 4.Push-S2 5.Pop-S2 6.Peek-S2 7.Display 0.Exit
Choice: 6
Stack 2 Top: 40

1.Push-S1 2.Pop-S1 3.Peek-S1 4.Push-S2 5.Pop-S2 6.Peek-S2 7.Display 0.Exit
Choice: 2
Popped from Stack 1: 20

1.Push-S1 2.Pop-S1 3.Peek-S1 4.Push-S2 5.Pop-S2 6.Peek-S2 7.Display 0.Exit
Choice: 5
Popped from Stack 2: 40

1.Push-S1 2.Pop-S1 3.Peek-S1 4.Push-S2 5.Pop-S2 6.Peek-S2 7.Display 0.Exit
Choice: 7
Stack 1 (bottom to top): 10 
Stack 2 (bottom to top): 50 

1.Push-S1 2.Pop-S1 3.Peek-S1 4.Push-S2 5.Pop-S2 6.Peek-S2 7.Display 0.Exit
Choice: 0
```

---

## Experiment 4(a)

**Question:**
Write a C++ program to convert a given Infix expression into its equivalent Postfix expression using the Stack data structure.

**Execution Code:**
```cpp
#include <iostream>
#include <stack>
#include <cctype>
using namespace std;

int precedence(char op) {
    if (op == '^') return 3;
    if (op == '*' || op == '/') return 2;
    if (op == '+' || op == '-') return 1;
    return 0;
}

bool isRightAssociative(char op) { return op == '^'; }

string infixToPostfix(string expr) {
    stack<char> st;
    string postfix = "";

    for (char ch : expr) {
        if (isalnum(ch)) {
            postfix += ch;
        }
        else if (ch == '(') {
            st.push(ch);
        }
        else if (ch == ')') {
            while (!st.empty() && st.top() != '(') {
                postfix += st.top();
                st.pop();
            }
            if (!st.empty()) st.pop(); // discard '('
        }
        else { // ch is an operator
            while (!st.empty() && st.top() != '(' &&
                   (precedence(st.top()) > precedence(ch) ||
                   (precedence(st.top()) == precedence(ch) && !isRightAssociative(ch)))) {
                postfix += st.top();
                st.pop();
            }
            st.push(ch);
        }
    }

    while (!st.empty()) {
        postfix += st.top();
        st.pop();
    }
    return postfix;
}

int main() {
    string expr;
    cout << "Enter infix expression: ";
    cin >> expr;

    cout << "Postfix expression: " << infixToPostfix(expr) << endl;
    return 0;
}
```

**Input:**
```text
A+B*(C-D)
```

**Output:**
```text
Enter infix expression: A+B*(C-D)
Postfix expression: ABCD-*+
```

---

## Experiment 4(b)

**Question:**
Write a C++ program to evaluate a given Postfix expression and compute its numeric result using the Stack data structure.

**Execution Code:**
```cpp
#include <iostream>
#include <stack>
#include <sstream>
#include <cctype>
using namespace std;

int evaluatePostfix(string expr) {
    stack<int> st;
    stringstream ss(expr);
    string tok;

    while (ss >> tok) {
        if (isdigit(tok[0]) || (tok.size() > 1 && tok[0] == '-' && isdigit(tok[1]))) {
            st.push(stoi(tok)); // token is an operand
        }
        else { // token is an operator
            int op2 = st.top(); st.pop();
            int op1 = st.top(); st.pop();
            int result = 0;
            switch (tok[0]) {
                case '+': result = op1 + op2; break;
                case '-': result = op1 - op2; break;
                case '*': result = op1 * op2; break;
                case '/': result = op1 / op2; break;
            }
            st.push(result);
        }
    }
    return st.top(); // final result
}

int main() {
    string expr;
    cout << "Enter postfix expression (space-separated): ";
    getline(cin, expr);

    cout << "Result = " << evaluatePostfix(expr) << endl;
    return 0;
}
```

**Input:**
```text
6 5 2 3 + 8 * + 3 + *
```

**Output:**
```text
Enter postfix expression (space-separated): 6 5 2 3 + 8 * + 3 + *
Result = 288
```

---

## Experiment 5

**Question:**
Write a C++ program to implement a Linear Queue using arrays and to perform basic queue operations — Enqueue, Dequeue, and Display.

**Execution Code:**
```cpp
#include <iostream>
using namespace std;

class Queue {
    int arr[5]; // small size for demo
    int front, rear;
public:
    Queue() {
        front = -1;
        rear = -1;
    }

    void enqueue(int x) {
        if (rear == 4) {
            cout << "Queue Overflow\n";
            return;
        }
        if (front == -1) front = 0;
        arr[++rear] = x;
        cout << x << " Enqueued\n";
    }

    void dequeue() {
        if (front == -1 || front > rear) {
            cout << "Queue Underflow\n";
            return;
        }
        cout << arr[front++] << " Dequeued\n";
        if (front > rear) {
            front = rear = -1; // queue becomes empty
        }
    }

    void display() {
        if (front == -1 || front > rear) {
            cout << "Queue is Empty\n";
            return;
        }
        cout << "Queue: ";
        for (int i = front; i <= rear; i++)
            cout << arr[i] << " ";
        cout << "\n";
    }
};

int main() {
    Queue q;
    q.enqueue(10);
    q.enqueue(20);
    q.enqueue(30);
    q.display();
    q.dequeue();
    q.display();
    return 0;
}
```

**Input:**
```text
No input required
```

**Output:**
```text
10 Enqueued
20 Enqueued
30 Enqueued
Queue: 10 20 30 
10 Dequeued
Queue: 20 30 
```

---

## Experiment 6

**Question:**
Write a C++ program to implement two queues using a single array and to perform basic queue operations — Enqueue, Dequeue, and Display — on both queues independently.

**Execution Code:**
```cpp
#include <iostream>
using namespace std;

class TwoQueues {
    int arr[6]; // small size for demo, split into two halves
    int mid, front1, rear1, front2, rear2;
public:
    TwoQueues() {
        mid = 3; // first half: 0-2 (Queue1), second half: 3-5 (Queue2)
        front1 = -1; rear1 = -1;
        front2 = mid - 1; rear2 = mid - 1;
    }

    void enqueue1(int x) {
        if (rear1 == mid - 1) { cout << "Queue1 Overflow\n"; return; }
        if (front1 == -1) front1 = 0;
        arr[++rear1] = x;
        cout << x << " Enqueued to Queue1\n";
    }

    void enqueue2(int x) {
        if (rear2 == 5) { cout << "Queue2 Overflow\n"; return; }
        if (front2 == mid - 1) front2 = mid;
        arr[++rear2] = x;
        cout << x << " Enqueued to Queue2\n";
    }

    void dequeue1() {
        if (front1 == -1 || front1 > rear1) { cout << "Queue1 Underflow\n"; return; }
        cout << arr[front1++] << " Dequeued from Queue1\n";
    }

    void dequeue2() {
        if (front2 == mid - 1 || front2 > rear2) { cout << "Queue2 Underflow\n"; return; }
        cout << arr[front2++] << " Dequeued from Queue2\n";
    }

    void display() {
        cout << "Queue1: ";
        for (int i = front1; i <= rear1 && front1 != -1; i++) cout << arr[i] << " ";
        cout << "\nQueue2: ";
        for (int i = front2; i <= rear2 && front2 != mid - 1; i++) cout << arr[i] << " ";
        cout << "\n";
    }
};

int main() {
    TwoQueues q;
    q.enqueue1(10);
    q.enqueue1(20);
    q.enqueue2(50);
    q.enqueue2(60);
    q.display();
    q.dequeue1();
    q.dequeue2();
    q.display();
    return 0;
}
```

**Input:**
```text
No input required
```

**Output:**
```text
10 Enqueued to Queue1
20 Enqueued to Queue1
50 Enqueued to Queue2
60 Enqueued to Queue2
Queue1: 10 20 
Queue2: 50 60 
10 Dequeued from Queue1
50 Dequeued from Queue2
Queue1: 20 
Queue2: 60
```
