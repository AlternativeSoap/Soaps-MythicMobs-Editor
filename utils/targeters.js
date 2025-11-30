// Targeters Database
const Targeters = {
    SELF: '@Self',
    TARGET: '@Target',
    TRIGGER: '@Trigger',
    ENTITIES: '@EntitiesInRadius{r=10}',
    PLAYERS: '@PlayersInRadius{r=10}',
    LOCATION: '@Forward{f=5}',
    LINE: '@Line{l=10}',
    CONE: '@Cone{a=45;r=10}'
};

window.Targeters = Targeters;
