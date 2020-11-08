type Person = {
    id: number;
    name: string;
}

const fixtures: Person[] = [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" },
    { id: 3, name: "Jack" },
]

fixtures.forEach((person) => {
    console.log(`[${person.id}] ${person.name}`);
});
