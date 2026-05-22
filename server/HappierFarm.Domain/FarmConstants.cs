namespace HappierFarm.Domain;

/// <summary>Grid defaults for new user rows until <c>GameSettings</c> is loaded. Runtime rules use SQL via <see cref="GameConfigRules"/>.</summary>
public static class FarmConstants
{
    public const int DefaultGridSize = 9;
}
