namespace HappierFarm.Domain.Entities;

public sealed class BarnUpgradeTierDefinition
{
    public int Tier { get; set; }
    public int BonusSlots { get; set; }
    public int GoldCost { get; set; }
}
